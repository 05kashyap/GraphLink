"""
Builds the social graph from the database and runs the recommender on it.

The graph is a DiGraph whose edges point from follower to followed user.
The algorithms themselves live in graph/functions.py; this module wires them
into the three recommendation cases and shapes the results for the API.
"""
import logging

import networkx as nx
import networkx.algorithms.community as nxcom

from users.models import Profile
from .functions import (FoFs, followback, articulation_points as artipoint,
                        eigenvector_followers, community_leader)

logger = logging.getLogger(__name__)

CASES = {
    1: {
        "label": "New to the network",
        "explanation": (
            "You don't follow anyone and nobody follows you yet (degree 0), so there are no "
            "neighbours to learn from. GraphLink suggests the most influential users "
            "(high eigenvector centrality) and bridge users (articulation points) who connect "
            "otherwise separate parts of the network."
        ),
    },
    2: {
        "label": "You're a bridge",
        "explanation": (
            "Removing you would split the network in two: you're an articulation point. "
            "GraphLink suggests the most connected user in each community, plus the other "
            "bridge users, so you can link the communities you sit between."
        ),
    },
    3: {
        "label": "Growing your circle",
        "explanation": (
            "You already have a few connections, so GraphLink looks two hops out: people "
            "followed by the people you follow (friends of friends), plus the network's most "
            "influential users."
        ),
    },
}

REASON_LABELS = {
    "friend_of_friend": "Friend of friends",
    "influential": "Influential",
    "bridge": "Bridge user",
    "community_hub": "Community hub",
}


def build_social_graph():
    """Return (DiGraph, {username: Profile}) for every user in a few queries."""
    profiles = (Profile.objects.select_related("user")
                .prefetch_related("followers")
                .order_by("user__username"))
    graph = nx.DiGraph()
    by_username = {}
    for profile in profiles:
        by_username[profile.user.username] = profile
        graph.add_node(profile.user.username)
    for username, profile in by_username.items():
        for follower in profile.followers.all():
            # edges start at the follower and end at the user being followed
            graph.add_edge(follower.username, username)
    return graph, by_username


def detect_communities(graph):
    """Communities ordered largest first, as {username: community index}."""
    if graph.number_of_edges() == 0:
        communities = [{node} for node in graph.nodes]
    else:
        communities = sorted(nxcom.greedy_modularity_communities(graph), key=len, reverse=True)
    return {node: index for index, members in enumerate(communities)
            for node in members}, len(communities)


def eigenvector_scores(graph):
    try:
        return nx.eigenvector_centrality(graph, max_iter=1000)
    except (nx.PowerIterationFailedConvergence, nx.NetworkXException):
        # Directed eigenvector centrality can fail to converge on some graphs
        # (e.g. acyclic ones); the undirected version always does.
        return nx.eigenvector_centrality(graph.to_undirected(), max_iter=1000)


def graph_payload():
    """Nodes, links and summary statistics for the network visualisation."""
    graph, _ = build_social_graph()
    undirected = nx.Graph(graph)
    community_of, community_count = detect_communities(graph)
    eigen = eigenvector_scores(graph) if graph.number_of_edges() else {}
    articulation = set(nx.articulation_points(undirected))

    nodes = [{
        "id": node,
        "community": community_of[node],
        "degree": undirected.degree(node),
        "in_degree": graph.in_degree(node),
        "out_degree": graph.out_degree(node),
        "eigenvector": round(eigen.get(node, 0.0), 4),
        "is_articulation": node in articulation,
    } for node in graph.nodes]
    links = [{"source": source, "target": target} for source, target in graph.edges]

    reciprocal = sum(1 for u, v in graph.edges if graph.has_edge(v, u)) // 2
    stats = {
        "nodes": graph.number_of_nodes(),
        "edges": graph.number_of_edges(),
        "communities": community_count,
        "density": round(nx.density(graph), 4),
        "average_degree": round(sum(dict(undirected.degree).values()) / max(len(graph), 1), 2),
        "reciprocal_pairs": reciprocal,
        "articulation_points": len(articulation),
    }
    return {"nodes": nodes, "links": links, "stats": stats}, community_of


def _safe_eigenvector_followers(user, graph):
    try:
        return eigenvector_followers(user, graph)
    except (nx.PowerIterationFailedConvergence, nx.NetworkXException):
        logger.warning("eigenvector centrality did not converge; skipping influential users")
        return []


def generate_suggestions(username):
    """
    There are 3 cases to solve:
    1. cold start
    2. user as articulation node
    3. user with small network

    Returns (case, {username: set(reason keys)}, [follow back usernames], graph).
    """
    G, _ = build_social_graph()
    Un_G = nx.Graph(G)
    user = username

    eigenvector_followerlist = _safe_eigenvector_followers(user, G)
    articulation_list = artipoint(user, Un_G)
    follow_back_list = followback(user, G)
    suggestions = {}

    def add(candidates, reason):
        for candidate in candidates:
            suggestions.setdefault(candidate, set()).add(reason)

    if Un_G.degree()[user] == 0:
        case = 1
        add(eigenvector_followerlist, "influential")
        add(articulation_list, "bridge")
        follow_back_list = []
    elif user in nx.articulation_points(Un_G):
        case = 2
        add(community_leader(G, Un_G), "community_hub")
        add(articulation_list, "bridge")
    else:
        case = 3
        add(eigenvector_followerlist, "influential")
        add(FoFs(user, G), "friend_of_friend")

    logger.info("Case %s triggered for %s", case, user)

    # Never suggest yourself, people you already follow, or people who are
    # already listed under "follow back".
    already_following = set(G.successors(user))
    excluded = already_following | set(follow_back_list) | {user}
    suggestions = {name: reasons for name, reasons in suggestions.items() if name not in excluded}
    return case, suggestions, follow_back_list, G
