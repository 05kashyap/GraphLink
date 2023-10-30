from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from feed.models import Like
from PIL import Image #pillow used for resizing
# Create your models here.

#upm tbd
class ProfileManager(models.Manager):
    '''Manages unfollowing and following'''
    def follow(self, user_profile, target_profile):
        target_profile.followers.add(user_profile.user)
        user_profile.following.add(target_profile.user)

    def unfollow(self, user_profile, target_profile):
        target_profile.followers.remove(user_profile.user)
        user_profile.following.remove(target_profile.user)
            


class FollowersCount(models.Model):
    follower = models.CharField(max_length=1000)
    user = models.CharField(max_length=1000)

    def __str__(self) -> str:
        return self.user
    
class FollowingCount(models.Model):
    following = models.CharField(max_length=1000)
    user = models.CharField(max_length=1000)

    def __str__(self) -> str:
        return self.user


class Profile(models.Model):
    '''User profile model'''
    user = models.OneToOneField(User, on_delete=models.CASCADE)#cascade: if one post of user del, user is not del but if user is del all posts die
    image = models.ImageField(default='default.jpg', upload_to='profile_pics')
    followers = models.ManyToManyField(User, related_name='followers')
    following = models.ManyToManyField(User, related_name='following')   
    objects = ProfileManager()
  
    def get_followers(self):
        return self.followers.all()

    def get_following(self):
        return self.following.all()
    
    def total_likes(self):
       return Like.objects.filter(user=self.user).count()
    def __str__(self):
        return f'{self.user.username} Profile'
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        img = Image.open(self.image.path)
        
        if img.height > 300 or img.width > 300: # resizing
            output_size = (300, 300)
            img.thumbnail(output_size)
            img.save(self.image.path)


