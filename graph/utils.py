import matplotlib.pyplot as plt
import base64
from io import BytesIO
import networkx as nx
from users.models import Profile
from collections import OrderedDict

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
            Social.add_edge(user, follower, weight= 1)

    pos = nx.spiral_layout(Social) 
    plt.figure(figsize=(10,5))
    nx.draw(Social, pos, with_labels=True, node_size=200, node_color='skyblue', style='dashed')
    #nx.draw(Social, pos, with_labels=True)
    edge_labels = dict([((u,v,), d['weight']) for u,v,d in Social.edges(data=True)])
    nx.draw_networkx_edge_labels(Social, pos)
    #plt.tight_layout()
    graph = get_graph()
    return graph
    
def generate_user_follow_suggestions(user):
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
    #print(len(Social.nodes())) 

    # Add edges
    for profile in profiles:
        username = profile.user.username
        followers = profile.followers.all()
        social_g[username] = list(followers)

    
    for key, value in social_g.items():
        social_g[key] = [str(v).removeprefix("<User: ") for v in value]
    print(social_g)
    #print(profiles)
    for user, followers in social_g.items():
        for follower in followers:
            Social.add_edge(user, follower, weight= 1)
    suggestions = []
    degree_centrality = nx.degree_centrality(Social)
    eigenvector_centrality = nx.eigenvector_centrality(Social, max_iter=1000)
    sorted_users = sorted(eigenvector_centrality.items(), key=lambda x: x[1], reverse=True)
    user_to_recommend = user
   
    
    if(user not in degree_centrality):
        
        suggestions += list(nx.articulation_points(Social))
        for user, centrality in sorted_users:
            if user != user_to_recommend and Social.has_edge(user_to_recommend, user) == False:
                suggestions.append(user)
                if len(suggestions) >= 5:  # Limit the number of recommendations
                    break

    else:
        
        top_2= get_top_n(degree_centrality, 2)
        suggestions.append(list(top_2.keys()))
        pagerank_scores = nx.pagerank(Social)
        neighbours = list(Social.neighbors(user))
        n = 5
        neighbours_sorted = sorted(neighbours,
            key= lambda x: pagerank_scores[x], reverse=True)
    
        suggestions += neighbours_sorted[:n]
    print(suggestions)
    return suggestions