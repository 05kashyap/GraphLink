import networkx as nx
import numpy as np
import networkx.algorithms.community as nxcom

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
    if user in totalconn:
        totalconn.remove(user) # remove the user
    return totalconn

def followback(user: str, graph : nx.DiGraph ):
    """ this returns the list of follower which user doesn't follow back 
        if user is new to network returns null """
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

def adamic_adar_index(G, node1, node2):
    # Get common neighbors of node1 and node2
    common_neighbors = set(G.neighbors(node1)).intersection(set(G.neighbors(node2)))
    # print(common_neighbors)
    # Calculate the Adamic-Adar Index
    adamic_adar = 0
    for common_neighbor in common_neighbors:
        degree_common_neighbor = G.degree(common_neighbor)
        if degree_common_neighbor > 1:
            adamic_adar += 1 / (np.log(degree_common_neighbor)) 
    return adamic_adar

def adamic_recommendations(user: str, graph: nx.Graph):
    
    recommendataion = [i for i in list(graph.nodes()) if i not in graph.neighbors(user) if adamic_adar_index(graph, user, i) > 1]
    if user in recommendataion: recommendataion.remove(user)
    return recommendataion
        
def articulation_points(user: str, graph: nx.Graph):
    """
    If the given user is one of the articulation points then
    he will recommended with other cut vertex of articulation points
    """
    articulations = list(nx.articulation_points(graph))
    # check if user is an articualtion node 
    if user in articulations:
        articulations.remove(user)
    if graph.degree()[user] == 0.0:
        return articulations
    else:
        friends = list(graph.neighbors(user))
        for i in friends:
            if i in articulations : articulations.remove(i)
        return articulations
    
def eigenvector_followers(user: str, graph: nx.DiGraph):
    """ this vector returns the list of users and their eigen vector """
    
    eigenvector_dict = nx.eigenvector_centrality(graph, max_iter=1000,)
    # sort the dict usings its value as reference
    
    followerslist = list(node for node, _ in eigenvector_dict.items() if _ > 0.2)
    if user in followerslist: followerslist.remove(user)
    
    # check if node has no connections
    if graph.to_undirected().degree()[user] == 0.0:
        return followerslist
    else:
        friends = list(graph.to_undirected().neighbors(user))
        for i in friends: 
            if i in followerslist: followerslist.remove(i)
        return followerslist

def community_leader(user, G, UG):
    communities = sorted(nxcom.greedy_modularity_communities(G), key=len, reverse=True)
    print(list(communities[0]))
    #cmli = list(communities[0])
    print(G.degree()[list(communities[0])[0]])
    #Keymax = max(cmli, key= lambda x: cmli[x])
    #print(Keymax)
    
    friends = list(G.neighbors(user))
    
    heads = []
    deg = dict(UG.degree())
    #Get most influential node for each 
    for community in communities:
        community = list(community)
        k = [x for x in deg if x in community]
        #print(k)
        v = [deg[x] for x in k]
        #print(v)
        com_head = k[v.index(max(v))]
        print(f"community head: {com_head}")
        heads.append(com_head)
        
    heads = list(set(heads) - set(friends))
    return heads