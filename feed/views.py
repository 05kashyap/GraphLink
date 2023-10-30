from typing import Any
from .utils import generate_meme, get_templates
from users.models import Profile
from django.db.models import Count, F
from .models import Like, Post, Comment
from django.core.files.storage import FileSystemStorage 
from .forms import CommentForm
from django.urls import reverse
from django.db.models import Count
from django.shortcuts import HttpResponseRedirect
from django.shortcuts import render, get_object_or_404, redirect
from django.http import HttpResponse
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.contrib.auth.models import User
from django.views.generic import (ListView, 
                                  DetailView, 
                                  CreateView,
                                  UpdateView,
                                  DeleteView
                                  )

#from .models import Post # takes post from database
# Create your views here.




def follow_view(request, profile_id):
    '''View that adds followers'''
    user_profile = request.user.profile
    target_profile = Profile.objects.get(pk=profile_id)
    Profile.objects.follow(user_profile, target_profile)
    return redirect('profile')

def unfollow_view(request, profile_id):
    '''View that removes followers'''
    user_profile = request.user.profile
    target_profile = Profile.objects.get(pk=profile_id)
    Profile.objects.unfollow(user_profile, target_profile)

    return redirect('profile')


class PostListView(ListView):
    '''Home page all posts view'''
    model = Post 
    template_name = 'feed/home.html'
    #context_object_name = 'posts'
    ordering = ['-date_posted'] # minus sign means newest to oldest
    paginate_by = 5

    def get_context_data(self, **kwargs: Any) -> dict[str, Any]:
        context = super().get_context_data(**kwargs)
        context['posts'] = Post.objects.order_by('-date_posted')
        top_post = Post.objects.annotate(like_count=Count('post_likes')).order_by(F('like_count').desc())[:1].first()
        context['top'] = top_post

        return context


class FollowPostListView(ListView):
    '''My feed view'''
    model = Post 
    template_name = 'feed/myfeed.html'
    context_object_name = 'posts'
    ordering = ['-date_posted'] # minus sign means newest to oldest
    paginate_by = 5

    def get_queryset(self):
        # Get the user's followings
        user = self.request.user
        followings = user.profile.following.all()
        followings_ids = followings.values_list('id', flat=True)

        # Filter the posts to show only those from the user's followings
        queryset = Post.objects.filter(author__in=followings_ids).order_by('-date_posted')
        return queryset

class UserPostListView(ListView):
    '''View specific users posts'''
    model = Post 
    template_name = 'feed/user_posts.html'
    #context_object_name = 'posts'
    #ordering = ['-date_posted'] # minus sign means newest to oldest
    paginate_by = 5

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        user = get_object_or_404(User, username=self.kwargs.get('username'))
        context['follow'] = False
        if self.request.user.is_authenticated:
            if self.request.user != user:
                if self.request.user in user.profile.followers.all():
                    context['follow'] = True
        # Calculate total likes for the user's posts
        total_likes = Like.objects.total_likes_for_user_posts(user)
        context['user_posts'] = Post.objects.filter(author=user).order_by('-date_posted')
        context['total_likes'] = total_likes
        return context
    
    def get_queryset(self):
        
        user = get_object_or_404(User, username=self.kwargs.get('username'))
        total_likes = Like.objects.total_likes_for_user_posts(user)

        queryset = Post.objects.filter(author=user).order_by('-date_posted')
        queryset.total_likes = total_likes
        return queryset
     

    
class CurrUserPostListView(LoginRequiredMixin,ListView):
    '''View logged in users' posts'''
    model = User 
    template_name = 'feed/user_profile.html'
    paginate_by = 5
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        user = self.request.user
        total_likes = Like.objects.total_likes_for_user_posts(user)
        context['user_posts'] = Post.objects.filter(author=user).order_by('-date_posted')
        context['total_likes'] = total_likes
        return context


class PostDetailView(DetailView):
    '''View post, comments in detail'''
    model = Post 
    fields = ['title', 'content']
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        post = self.get_object()
        context['is_liked'] = Like.objects.filter(user=self.request.user, post=post).exists()
        context['comments'] = post.comments.all()
        return context

    def post(self, request, *args, **kwargs):
        if 'like' in request.POST:
            # Create new Like object
            Like.objects.create(
                user=request.user,
                post=self.get_object(),
                post_user=self.get_object().author
            )
            
            return HttpResponseRedirect(reverse('post-detail', args=[self.kwargs['pk']]))
        elif 'unlike' in request.POST:
            Like.objects.filter(user=request.user, post=self.get_object()).delete()
            return HttpResponseRedirect(reverse('post-detail', args=[self.kwargs['pk']]))

        return super().post(request, *args, **kwargs)

class PostCreateView(LoginRequiredMixin, CreateView):
    '''Form to create a meme'''
    model = Post 
    fields = ['title', 'content','meme_template_id','top_text','bottom_text']


    def form_valid(self, form):
        form.instance.author = self.request.user
        template_id = form.cleaned_data['meme_template_id'] 
        top_text = form.cleaned_data['top_text']
        bottom_text = form.cleaned_data['bottom_text']
        meme_url = generate_meme(template_id, top_text, bottom_text)
        #m_url = get_meme_url()
        '''
        if form.cleaned_data['image']:
            image = form.cleaned_data['image']
            fss = FileSystemStorage()
            file = fss.save(image.name, image)
            form.instance.image = file '''
        post = form.save(commit=False) 
        post.meme = meme_url
        post.save()
        return super().form_valid(form)
    
#make into class based view for pagination later    
def meme_templates(request):
    '''View to return available templates'''
    memes = get_templates()
    meme_zip = zip(memes[0],memes[1])
    paginate_by = 5
    context = {
       'memes' : meme_zip
    }
    return render(request, 'feed/memes.html', context)#html template

class CommentCreateView(LoginRequiredMixin, CreateView):
    '''Comment creation form'''
    model = Comment
    form_class = CommentForm
    template_name = 'feed/post_comment.html'

    def form_valid(self, form):
        post_id = self.kwargs['pk']
        post = get_object_or_404(Post, pk=post_id)  # Get the associated post
        form.instance.post = post  # Associate the comment with the post
        form.instance.author = self.request.user  # Set the comment's author to the logged-in user
        return super().form_valid(form)
    
    def get_success_url(self):
        # Redirect to the post detail page after comment creation
        return reverse('post-detail', args=[self.kwargs['pk']])

class PostUpdateView(LoginRequiredMixin, UserPassesTestMixin, UpdateView):
    '''Meme updation form'''
    model = Post 
    fields = ['title', 'content','meme_template_id','top_text','bottom_text']

    def form_valid(self, form):
        form.instance.author = self.request.user
        template_id = form.cleaned_data['meme_template_id'] 
        top_text = form.cleaned_data['top_text']
        bottom_text = form.cleaned_data['bottom_text']
        meme_url = generate_meme(template_id, top_text, bottom_text)
        #m_url = get_meme_url()
        '''
        if form.cleaned_data['image']:
            image = form.cleaned_data['image']
            fss = FileSystemStorage()
            file = fss.save(image.name, image)
            form.instance.image = file '''
        post = form.save(commit=False) 
        post.meme = meme_url
        post.save()
        return super().form_valid(form)
    
    def test_func(self) -> bool | None:
        post = self.get_object()
        if self.request.user == post.author:
            return True
        return False

class PostDeleteView(LoginRequiredMixin, UserPassesTestMixin, DeleteView):
    '''Meme delete view'''
    model = Post 
    success_url = '/'

    def test_func(self) -> bool | None:
        post = self.get_object()
        if self.request.user == post.author:
            return True
        return False

