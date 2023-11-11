import networkx as nx
import numpy as np

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
    return articulations
    
    