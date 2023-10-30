from django.db import models
from django.utils import timezone
from django.contrib.auth.models import User
from django.urls import reverse
from django.core.paginator import Paginator
from PIL import Image
from django.db.models import Count
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

# Create your models here.

class Post(models.Model):
    '''Meme post model'''
    title = models.CharField(max_length=100)
    content = models.TextField()
    date_posted = models.DateTimeField(default=timezone.now)
    author = models.ForeignKey(User, on_delete=models.CASCADE)#if user deleted, posts deleted
    image = models.ImageField(upload_to='post_pics', default='default.jpg')#option to add custom image functionality
    likes = models.IntegerField(default=0)
    meme_template_id = models.CharField(max_length=100, default="bilbo") 
    top_text = models.CharField(max_length=100, default="Enter top text")
    bottom_text = models.CharField(max_length=100, default="Enter top text")
    meme = models.URLField(blank=True)


    def __str__(self):
        '''returns title'''
        return self.title

    def get_absolute_url(self):
        '''returns to post detail using pk after post is created'''
        return reverse("post-detail", kwargs={"pk": self.pk}) #to generate path to redirect after creating post

    def save(self, *args, **kwargs):
        '''Update like count + code to resize images (Functionality can be added to add custom images)'''
        if self.pk is not None:  
            self.likes = self.post_likes.count() # use new related_name

        super().save(*args, **kwargs)
        img = Image.open(self.image.path)
        
        if img.height > 300 or img.width > 300: # resizing
            output_size = (300, 300)
            img.thumbnail(output_size)
            img.save(self.image.path)

class Comment(models.Model):
    '''Comments model'''
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')   
    author = models.ForeignKey(User, on_delete=models.CASCADE, null=True)#if user deleted, posts deleted
    body = models.TextField()
    created_on = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return self.title


class LikeManager(models.Manager):
    '''manages user likes'''
    def total_likes_for_user_posts(self, user):
        try:
            return self.filter(post__author=user).values('post__author').annotate(total_likes=Count('id')).values('total_likes')[0]['total_likes'] #known issue: messes up for 0 likes, fix latr
        except:
            return 0 

class Like(models.Model):
    '''likes'''
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='post_likes')
    #imestamp = models.DateTimeField(auto_now_add=True)
    post_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='liked_posts')
    objects = LikeManager()
    class Meta:
        unique_together = ('user', 'post')

