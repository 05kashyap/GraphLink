import networkx as nx
from django.contrib.auth.models import User
from rest_framework import permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from users.serializers import UserSummarySerializer
from .alterutil import CASES, REASON_LABELS, detect_communities, generate_suggestions, graph_payload


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def network(request):
    '''The whole social graph with communities and centrality scores'''
    payload, _ = graph_payload()
    return Response(payload)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def recommendations(request):
    '''Who the recommender suggests the logged-in user should follow, and why'''
    me = request.user.username
    case, suggestions, follow_back, G = generate_suggestions(me)
    community_of, _ = detect_communities(G)
    following = set(G.successors(me))

    usernames = set(suggestions) | set(follow_back)
    users = {user.username: user for user in
             User.objects.filter(username__in=usernames).select_related("profile")}

    def summary(username):
        data = UserSummarySerializer(users[username], context={"request": request}).data
        data["community"] = community_of.get(username)
        data["follower_count"] = G.in_degree(username)
        return data

    entries = []
    for username, reasons in suggestions.items():
        # people you follow who also follow this suggestion ("mutual" connections)
        via = sorted(f for f in following if G.has_edge(f, username))
        entries.append({
            "user": summary(username),
            "reasons": [{"key": key, "label": REASON_LABELS[key]} for key in sorted(reasons)],
            "via": via,
        })
    entries.sort(key=lambda e: (-len(e["reasons"]), -len(e["via"]),
                                -e["user"]["follower_count"], e["user"]["username"]))

    undirected = nx.Graph(G)
    return Response({
        "case": case,
        "case_label": CASES[case]["label"],
        "explanation": CASES[case]["explanation"],
        "me": {
            "username": me,
            "community": community_of.get(me),
            "degree": undirected.degree(me),
            "followers": G.in_degree(me),
            "following": G.out_degree(me),
        },
        "suggestions": entries,
        "follow_back": [summary(username) for username in sorted(follow_back)],
    })
