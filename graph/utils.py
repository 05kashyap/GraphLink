import matplotlib.pyplot as plt
import base64
from io import BytesIO
import networkx as nx
from users.models import Profile
from collections import OrderedDict
from django.contrib.auth.models import User



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
    

    # Verify node count
    print(len(Social.nodes())) 

    # Add edges
    for profile in profiles:
        username = profile.user.username
        followers = profile.followers.all()
        social_g[username] = list(followers)

    
    for key, value in social_g.items():
        social_g[key] = [str(v).removeprefix("<User: ") for v in value]
    #print(social_g)
    #print(profiles)
    for user, followers in social_g.items():
        for follower in followers:
            Social.add_edge(follower, user)
    
    communities = nx.community.girvan_newman(Social)
    k = len(Social.nodes())//4 + 1

    # Select the k-th community from the Girvan-Newman iterator
    for i in range(k):
        community = next(communities)

    # Assign a color to each community for node coloring
    node_colors = {}
    for i, com in enumerate(community):
        for node in com:
            node_colors[node] = i

    # Convert the node_colors dictionary to a list for coloring nodes
    colors = [node_colors[node] for node in Social.nodes()]
    d = dict(Social.degree)# used for size increase based on degree

    # Plot the graph with nodes colored according to their community
    pos = nx.spring_layout(Social,  k=1, iterations=2)  # Define the layout for a better visualization
    nx.draw(Social, pos, node_color=colors, node_size=[v * 80 for v in d.values()], with_labels=True, cmap=plt.cm.tab10)
    

    

    #pos = nx.spring_layout(Social, k=0.001, iterations=2) 
    #pos = nx.kamada_kawai_layout(Social)
    #plt.figure(figsize=(10,6))
    
    #nx.draw(Social, pos, with_labels=True, node_size=[v * 100 for v in d.values()], node_color='skyblue', style='dashed')
    #nx.draw(Social, pos, with_labels=True)
    #edge_labels = dict([((u,v,), d['weight']) for u,v,d in Social.edges(data=True)])
    
    #plt.tight_layout()



    #plt.show()
    graph = get_graph()
    return graph

def FoFs(user : str, Graph : nx.Graph) -> set:

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

def generate_graph(user):
    logged_user = user.user.username
    social_g = {}
    profiles = Profile.objects.all()
    
    Social = nx.Graph()
    # Get list of usernames
    usernames = []
    for profile in profiles:
        usernames.append(profile.user.username)
    # Print usernames  
    #print(usernames)
    # Create graph from usernames 
    Social.add_nodes_from(usernames)
    # Verify node count
    #print(len(Social.nodes())) 
    # Add edges
    for profile in profiles:
        username = profile.user.username
        followers = profile.followers.all()
        social_g[username] = list(followers)
    
    for key, value in social_g.items():
        social_g[key] = [str(v).removeprefix("<User: ") for v in value]
    for user, followers in social_g.items():
        for follower in followers:
            Social.add_edge(user, follower)
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
        return suggestions[:5]
    # User with few followers
    else:
        print('Case 2 triggered')
        # try to recommend friends of friends 
        suggestions.extend(FoFs(user, G))
        suggestions = [User.objects.get(username=username) for username in suggestions]
        return suggestions[:5]
        
    
# def mutual_friends(user : str, Graph : nx.Graph) -> set:

#     """
#     This function calcuates the first degree mutual friends and will return set of those users.

#     Returns:
#         set: set of mutual friends
#     """
#     if user not in Graph.nodes():
#         print("na")
#         raise(Exception("No such user"))
#     connection = list(Graph.neighbors(user)) # stores the list of neighbors
#     mutconnlist = list(set(Graph.neighbors(x)) for x in connection) # stores the list of list of neigbors 
    
#     # create a set to store all connections
#     totalconn = set()
#     for friends in mutconnlist:
#         for indivdual in friends:
#             totalconn.add(indivdual)
            
#     # remove already known connections
#     totalconn = totalconn - set(connection)
#     totalconn.remove(user) # remove the user
#     return totalconn



# def generate_user_follow_suggestions(user):
#     logged_user = user.user.username
#     social_g = {
#     }
#     profiles = Profile.objects.all()
    
#     Social = nx.Graph()
    
#     # Get list of usernames
#     usernames = []
#     for profile in profiles:
#         usernames.append(profile.user.username)
#     # Print usernames  
#     #print(usernames)
#     # Create graph from usernames 
#     Social.add_nodes_from(usernames)
#     # Verify node count
#     #print(len(Social.nodes())) 
#     # Add edges
#     for profile in profiles:
#         username = profile.user.username
#         followers = profile.followers.all()
#         social_g[username] = list(followers)
    
#     for key, value in social_g.items():
#         social_g[key] = [str(v).removeprefix("<User: ") for v in value]
#     for user, followers in social_g.items():
#         for follower in followers:
#             Social.add_edge(user, follower)
#     #print(Social.edges)
    
#     suggestions = []
#     degree_centrality = nx.degree_centrality(Social)
#     eigenvector_centrality = nx.eigenvector_centrality(Social, max_iter=1000)
#     sorted_users = sorted(eigenvector_centrality.items(), key=lambda x: x[1], reverse=True)
#     user_to_recommend = logged_user
#     print(degree_centrality)

    
#     if(degree_centrality[user_to_recommend] == 0.0): # for cold start case
#         print("case 1 triggered")
#         print(list(nx.articulation_points(Social)))
#         suggestions += list(nx.articulation_points(Social))
#         for user, centrality in sorted_users:
#             if user != user_to_recommend and Social.has_edge(user_to_recommend, user) == False and user not in suggestions:
#                 suggestions.append(user)
#                 if len(suggestions) >= 5:  # Limit the number of recommendations
#                     break

#     else:
#         print("case 1 triggered")
#         pagerank_scores = nx.pagerank(Social)
#         print("pg", pagerank_scores)
#         #neighbours = list(Social.neighbors(logged_user))
#         n = 5
#         #print(neighbours)
#         neighbours_sorted = sorted(Social,
#             key= lambda x: pagerank_scores[x], reverse=True)
#         print(neighbours_sorted)
#         neighbours_sorted.remove(user_to_recommend)
#         suggestions += neighbours_sorted[:n]

#     return suggestions[:3]