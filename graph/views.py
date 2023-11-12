from django.shortcuts import render
from django.shortcuts import render
from django.core.files import File
# Create your views here.
import matplotlib.pyplot as plt
import networkx as nx
from .utils import get_plot, generate_user_follow_suggestions
from .alterutil import get_plot as plot, generate_user_follow_suggestions as suggestions
from django.conf import settings
from users.models import Profile




def plot_network(request):

    chart, social = get_plot() 
    recs, followbacks = suggestions(request.user.profile)
    return render(request, 'graph/network.html', {'chart':chart, 'suggestions': recs, 'followback':followbacks, 'social':social})