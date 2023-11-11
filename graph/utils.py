# import matplotlib.pyplot as plt
# import base64
# from io import BytesIO
# import networkx as nx
# from users.models import Profile
# from collections import OrderedDict
# from django.contrib.auth.models import User
# from .functions import FoFs, followback, adamic_recommendations


# def get_top_n(dict_, n):
#   return OrderedDict(sorted(dict_.items(), key=lambda x: x[1], reverse=True)[:n])

# def get_graph():
#     buffer = BytesIO()
#     plt.savefig(buffer, format='png')
#     buffer.seek(0)
#     image_png = buffer.getvalue()
#     graph = base64.b64encode(image_png)
#     graph = graph.decode('utf-8')
#     buffer.close()
#     return graph

# def get_plot():
#     plt.switch_backend('AGG')
#     social_g = {
#     }
#     profiles = Profile.objects.all()
#     Social = nx.DiGraph()
#     # Get list of usernames
#     usernames = []
#     for profile in profiles:
#         usernames.append(profile.user.username)
#     # Create graph from usernames 
#     Social.add_nodes_from(usernames)
#     # Verify node count
#     print(len(Social.nodes())) 
#     # Add edges
#     for profile in profiles:
#         username = profile.user.username
#         followers = profile.followers.all()
#         social_g[username] = list(followers)
#     for key, value in social_g.items():
#         social_g[key] = [str(v).removeprefix("<User: ") for v in value]   
#     for user, followers in social_g.items():
#         for follower in followers:
#             Social.add_edge(follower, user)
    
#     communities = nx.community.girvan_newman(Social)
#     k = len(Social.nodes())//4 + 1
#     for i in range(6):
#         community = next(communities)
        
#     node_colors = {}
#     for i, com in enumerate(community):
#         for node in com:
#             node_colors[node] = i
    
#     colors = [node_colors[node] for node in Social.nodes()]
    
#     # take args of number of communities to form to not disintegrate 
#     # pos = nx.spring_layout(Social, k=1, iterations=2, scale=5) 
#     plt.figure(figsize=(10,6))  
#     nodesize = [v*3000 for v in nx.degree_centrality(Social).values()]
#     options = {'pos':nx.layout.spring_layout(Social, k = 1, iterations=20, scale=5),
#                'with_labels':True,
#                'node_color':'skyblue',
#                'style':'dotted',
#                'node_size':nodesize,
#                'node_color':colors,
#                'cmap':plt.cm.Pastel1,
#                }
#     nx.draw(Social, **options)
#     #nx.draw(Social, pos, with_labels=True)
#     #edge_labels = dict([((u,v,), d['weight']) for u,v,d in Social.edges(data=True)])
#     graph = get_graph()
#     return graph,[social_g.items()]

# def generate_graph(user):
#     logged_user = user.user.username
#     social_g = {}
#     profiles = Profile.objects.all()
    
#     Social = nx.DiGraph()
    
#     # Get list of usernames
#     usernames = []
#     for profile in profiles:
#         usernames.append(profile.user.username)

#     # Create graph from usernames 
#     Social.add_nodes_from(usernames)

#     # Add edges
#     for profile in profiles:
#         username = profile.user.username
#         followers = profile.followers.all()
#         social_g[username] = list(followers)
    
#     for key, value in social_g.items():
#         social_g[key] = [str(v).removeprefix("<User: ") for v in value]
    
#     for user, followers in social_g.items():
#         for follower in followers:
#             Social.add_edge(follower, user)

#     #print(Social.edges)
#     return [logged_user, Social]

# def generate_user_follow_suggestions(user) -> list:
#     user, G = generate_graph(user)
#     # find the degree centrality of user to check if the user is new or not
#     degree = nx.degree_centrality(G)
#     # dict of eigenvector_centrality
#     eigenvector_centrality = nx.eigenvector_centrality(G, max_iter=1000)
#     # sort the user list based on their eigenvector values
#     sorted_users = sorted(eigenvector_centrality.items(), key= lambda a:a[1], reverse=True)
    
#     # create a suggestion list
#     suggestions = []
#     follow = []
#     follow.extend(followback(user, G))
#     recommendations = adamic_recommendations(user, G.to_undirected())
#     # print(recommendations)
    
#     user_degree = degree[user]
#     if(user_degree == 0.0):
#         print("Case 1 triggered")
#         # print(nx.articulation_points(G))
#         suggestions.extend(list(nx.articulation_points(G)))
#         # suggest some users with high influence
#         for useri, _ in sorted_users:
#             if useri != user and G.has_edge(user, useri) == False and useri not in suggestions:
#                 suggestions.append(useri)
#         suggestions = [User.objects.get(username=username) for username in suggestions]
#         return suggestions
#     # User with few followers
#     else:
#         print('Case 2 triggered')
#         # try to recommend friends of friends 
#         suggestions.extend(FoFs(user, G.to_undirected()))
#         for useri, _ in sorted_users:
#             if useri != user and G.has_edge(user, useri) == False and useri not in suggestions:
#                 suggestions.append(useri)
                
#         suggestions = [x for x in suggestions if x not in follow]
#         suggestions = [User.objects.get(username=username) for username in suggestions]
#         return suggestions, follow
import matplotlib.pyplot as plt
import base64
from io import BytesIO
import networkx as nx
from users.models import Profile
from collections import OrderedDict
from django.contrib.auth.models import User
import networkx.algorithms.community as nxcom


def get_top_n(dict_, n):
  return OrderedDict(sorted(dict_.items(), key=lambda x: x[1], reverse=True)[:n])

def get_graph():
    buffer = BytesIO()
    plt.savefig(buffer, format='png')
    buffer.seek(0)
    image_png = buffer.getvalue()
    graph = base64.b64encode(image_png)
    graph = graph.decode('utf-8')
    buffer.close()
    return graph

def set_node_community(G, communities):
        '''Add community to node attributes'''
        for c, v_c in enumerate(communities):
            for v in v_c:
                # Add 1 to save 0 for external edges
                G.nodes[v]['community'] = c + 1
def set_edge_community(G):
    '''Find internal edges and add their community to their attributes'''
    for v, w, in G.edges:
        if G.nodes[v]['community'] == G.nodes[w]['community']:
            # Internal edge, mark with community
            G.edges[v, w]['community'] = G.nodes[v]['community']
        else:
            # External edge, mark as 0
            G.edges[v, w]['community'] = 0
def get_color(i, r_off=1, g_off=1, b_off=1):
    '''Assign a color to a vertex.'''
    r0, g0, b0 = 0, 0, 0
    n = 16
    low, high = 0.1, 0.9
    span = high - low
    r = low + span * (((i + r_off) * 3) % n) / (n - 1)
    g = low + span * (((i + g_off) * 5) % n) / (n - 1)
    b = low + span * (((i + b_off) * 7) % n) / (n - 1)
    return (r, g, b)

def get_plot():

    plt.switch_backend('AGG')
    social_g = {
    }
    profiles = Profile.objects.all()

    Social = nx.DiGraph()

    # Get list of usernames
    usernames = []
    for profile in profiles:
        usernames.append(profile.user.username)

    # Print usernames
    #print(usernames)

    # Create graph from usernames
    Social.add_nodes_from(usernames)

    # Add edges
    for profile in profiles:
        username = profile.user.username
        followers = profile.followers.all()
        social_g[username] = list(followers)


    for key, value in social_g.items():
        social_g[key] = [str(v).removeprefix("<User: ") for v in value]
    for user, followers in social_g.items():
        for follower in followers:
            Social.add_edge(follower, user)

    

    d = dict(Social.degree)# used for size increase based on degree

    communities = sorted(nxcom.greedy_modularity_communities(Social), key=len, reverse=True)
    
    print(f"The graph has {len(communities)} communities.")
    set_node_community(Social, communities)
    set_edge_community(Social)
    node_color = [get_color(Social.nodes[v]['community']) for v in Social.nodes]
    # Set community color for edges between members of the same community (internal) and intra-community edges (external)
    external = [(v, w) for v, w in Social.edges if Social.edges[v, w]['community'] == 0]
    internal = [(v, w) for v, w in Social.edges if Social.edges[v, w]['community'] > 0]
    internal_color = ['black' for e in internal]
    pos = nx.spring_layout(Social, k=0.4, iterations=2)
    #pos = nx.kamada_kawai_layout(Social)
    plt.figure(figsize=(10,6))

    nx.draw_networkx(Social, pos,edge_color="silver",edgelist = external, with_labels=True, node_size=[v * 100 for v in d.values()])
    nx.draw_networkx(
        Social,
        pos=pos,
        node_color=node_color,
        edgelist=internal,
        edge_color=internal_color, node_size=[v * 100 for v in d.values()])
    #nx.draw(Social, pos, with_labels=True)
    #edge_labels = dict([((u,v,), d['weight']) for u,v,d in Social.edges(data=True)])

    #plt.tight_layout()
    graph = get_graph()
    return graph,[social_g.items()]

def FoFs(user : str, Graph : nx.DiGraph) -> set:

    """
    This function calcuates the first degree mutual friends and will return set of those users.

    Returns:
        set: set of second degree friends
    """
    if user not in Graph.nodes():
        print("na")
        raise(Exception("No such user"))
    connection = list(Graph.neighbors(user)) # stores the list of neighbors
    mutconnlist = list(set(Graph.neighbors(x)) for x in connection) # stores the list of list of neigbors 
    
    # create a set to store all connections
    totalconn = set()
    for friends in mutconnlist:
        for indivdual in friends:
            totalconn.add(indivdual)
            
    # remove already known connections
    totalconn = totalconn - set(connection)
    totalconn.remove(user) # remove the user
    return totalconn

def followback(user: str, graph : nx.Graph ):
    # create a digraph 
    # edgelist = list(graph.edges())
    # print(edgelist)
    # dg = nx.DiGraph()
    # dg.add_edges_from(edgelist)
    dg = graph
    graph = graph.to_undirected()
    following = set(dg.neighbors(user))
    connection = set(graph.neighbors(user))
    return list(connection - following)

def generate_graph(user):
    logged_user = user.user.username
    social_g = {}
    profiles = Profile.objects.all()
    
    Social = nx.DiGraph()
    
    # Get list of usernames
    usernames = []
    for profile in profiles:
        usernames.append(profile.user.username)

    # Create graph from usernames 
    Social.add_nodes_from(usernames)

    # Add edges
    for profile in profiles:
        username = profile.user.username
        followers = profile.followers.all()
        social_g[username] = list(followers)
    
    for key, value in social_g.items():
        social_g[key] = [str(v).removeprefix("<User: ") for v in value]
    
    for user, followers in social_g.items():
        for follower in followers:
            Social.add_edge(follower, user)

    #print(Social.edges)
    return [logged_user, Social]

def generate_user_follow_suggestions(user) -> list:
    user, G = generate_graph(user)
    # find the degree centrality of user to check if the user is new or not
    degree = nx.degree_centrality(G)
    # dict of eigenvector_centrality
    eigenvector_centrality = nx.eigenvector_centrality(G, max_iter=1000)
    # sort the user list based on their eigenvector values
    sorted_users = sorted(eigenvector_centrality.items(), key= lambda a:a[1], reverse=True)
    
    # create a suggestion list
    suggestions = []
    follow = []
    follow.extend(followback(user, G))
    
    user_degree = degree[user]
    if(user_degree == 0.0):
        print("Case 1 triggered")
        # print(nx.articulation_points(G))
        suggestions.extend(list(nx.articulation_points(G)))
        # suggest some users with high influence
        for useri, _ in sorted_users:
            if useri != user and G.has_edge(user, useri) == False and useri not in suggestions:
                suggestions.append(useri)
        suggestions = [User.objects.get(username=username) for username in suggestions]
        return suggestions
    # User with few followers
    else:
        print('Case 2 triggered')
        # try to recommend friends of friends 
        suggestions.extend(FoFs(user, G.to_undirected()))
        suggestions = [x for x in suggestions if x not in follow]
        suggestions = [User.objects.get(username=username) for username in suggestions]
        return suggestions, follow
        