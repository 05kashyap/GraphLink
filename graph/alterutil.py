from matplotlib import pyplot as plt
import base64
from io import BytesIO
import networkx as nx
import networkx.algorithms.community as nxcom
from users.models import Profile
from collections import OrderedDict
from django.contrib.auth.models import User
from .functions import FoFs, followback, adamic_recommendations, articulation_points as artipoint, eigenvector_followers, community_leader

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

def get_top_n(dict_, n):
  return OrderedDict(sorted(dict_.items(), key=lambda x: x[1], reverse=True)[:n])

def get_graph():
    """ This function help us to plot the graph without saving it,
        dynamically changes the graph plot to print the graph"""
    buffer = BytesIO()
    plt.savefig(buffer, format='png')
    buffer.seek(0)
    image_png = buffer.getvalue()
    graph = base64.b64encode(image_png)
    graph = graph.decode('utf-8')
    buffer.close()
    return graph
       
def generate_user_graph(user):
    """ builds a graph from parsing the data given 
        returns : logged_user , Graph instance """
    # this function takes the user object to build a graph
    logged_user = user.user.username
    social_g = {}
    profiles = Profile.objects.all()
    
    # create a graph instance
    Social = nx.DiGraph()
    # list out the users
    usernames = []
    for profile in profiles:
        usernames.append(profile.user.username)
    
    # clean the data 
    for profile in profiles:
        usrname = profile.user.username
        followers = list(profile.followers.all())
        social_g[usrname] = followers
    
    for key, value in social_g.items():
        social_g[key] = [str(v).removeprefix("<User: ") for v in value]
    
    # add nodes and edges 
    Social.add_nodes_from(usernames)
    # edges starts from followers and end at user
    for usr, followers in social_g.items():
        for follower in followers:
            Social.add_edge(follower, usr)
    return [logged_user, Social]
       
def get_plot():
    """ this function is used to plot the graph """
    plt.switch_backend('AGG')
    Social , social_g = genrate_social_network()
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
    # pos = nx.spring_layout(Social, k=1, iterations=2, scale=5)
    pos = nx.kamada_kawai_layout(Social)
    plt.figure(figsize=(10,6))

    nx.draw_networkx(Social, pos,edge_color="silver",edgelist = external, with_labels=True, node_size=[v * 100 for v in d.values()])
    nx.draw_networkx(
        Social,
        pos=pos,
        node_color=node_color,
        edgelist=internal,
        edge_color=internal_color, node_size=[v * 100 for v in d.values()])
    
    graph = get_graph()
    return graph,[social_g.items()]
    
def genrate_social_network():
    """ this generate the whole social network """
    social_g = {}
    profiles = Profile.objects.all()
    
    Social = nx.DiGraph()
    
    # get list of users
    usernames = []
    for profile in profiles:
        usernames.append(profile.user.username)
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
    return Social, social_g


def generate_suggestions(user): 
    """
    there will 3 cases to solve 
    1. cold start 
    2. user as articulation node
    3. user with small network
    """
    user, G = generate_user_graph(user)
    Un_G = nx.Graph(G)
    # UG = G.to_undirected()
    eigenvector_followerlist = eigenvector_followers(user, G)
    articulation_list = artipoint(user, Un_G)
    
    follow_back_list = followback(user, G)
    suggestions = list()

    
    # check if the particular user node belongs to cold start case
    if Un_G.degree()[user] == 0.0 : # ensure node has no connections
        print("Case 1 triggred (user is new to network)")
        suggestions.extend(eigenvector_followerlist)
        suggestions.extend(articulation_list)
        
        print("ar",articulation_list)
        print("ei",eigenvector_followerlist)
        suggestions = list(set(suggestions))
        suggestions = [User.objects.get(username=username) for username in suggestions]
        return suggestions, list()
    elif user in nx.articulation_points(Un_G):
        print('Case 2 triggred (user is an articulation point)')
        # suggestions.extend(eigenvector_followerlist)
        suggestions.extend(community_leader(user, G, Un_G))
        if user in suggestions: suggestions.remove(user)
        suggestions.extend(articulation_list)
        suggestions = list(set(suggestions))
        suggestions = [x for x in suggestions if x not in follow_back_list]
        suggestions = [User.objects.get(username=username) for username in suggestions]
        follow_back_list = [User.objects.get(username=username) for username in follow_back_list]
        return suggestions, follow_back_list
    else:
        print('Case 3 triggred (user has a few connections)')
        suggestions.extend(eigenvector_followerlist)
        suggestions.extend(FoFs(user, G))
        suggestions = list(set(suggestions))
        suggestions = [x for x in suggestions if x not in follow_back_list]
        suggestions = [User.objects.get(username=username) for username in suggestions]
        follow_back_list = [User.objects.get(username=username) for username in follow_back_list]
        return suggestions, follow_back_list
        
        
        
    
# def generate_user_follow_suggestions(user):

#     user, G = generate_user_graph(user)
#     UG = G.to_undirected()
#     # print(user,"\n")
    
#     # find the degree centrality of user to check if the user is new or not
#     degree = nx.degree_centrality(G)
#     # print()
#     # print(degree)
    
#     # dict of eigenvector_centrality
#     eigenvector_centrality = nx.eigenvector_centrality(G, max_iter=1000)
#     # print(eigenvector_followers(user, G))
#     # print()
#     # print(eigenvector_centrality)
    
#     # sort the user list based on their eigenvector values
#     sorted_users = sorted(eigenvector_centrality.items(), key= lambda a:a[1], reverse=True)
    
#     # create a suggestion list
#     suggestions = []
#     # create a follow back list 
#     follow = []
#     follow.extend(followback(user, G))
#     # print(follow)
    
#     articulations = list(nx.articulation_points(UG))
#     # print(articulations)
    
#     edge = sorted(nx.edge_betweenness_centrality(G).items(), key=lambda x:x[1], reverse=True)
#     # print(edge)
       
#     user_degree = degree[user]
#     if(user_degree == 0.0):
#         print("Case 1 triggered")
#         # print(nx.articulation_points(G))
#         suggestions.extend(list(articulations))
#         # suggest some users with high influence
#         for useri, _ in sorted_users:
#             if useri != user and G.has_edge(user, useri) == False and useri not in suggestions:
#                 suggestions.append(useri)
#         suggestions = [User.objects.get(username=username) for username in suggestions]
#         # print(suggestions)
#         return suggestions
#     # User with few followers
#     elif( user in articulations):
#         print('Case 2 triggered')
#         # try to recommend friends of friends 
#         # print(artipoint(user, G))
#         suggestions = community_leader(G, UG)
#         suggestions.extend(artipoint(user, G))
#         suggestions = [x for x in suggestions if x not in follow]
#         suggestions = [User.objects.get(username=username) for username in suggestions]
#         return suggestions, follow
#     else:
#         print('case 3 triggered')
#         suggestions.extend(FoFs(user, UG))
#         suggestions = [x for x in suggestions if x not in follow]
#         suggestions = [User.objects.get(username=username) for username in suggestions]
#         return suggestions, follow