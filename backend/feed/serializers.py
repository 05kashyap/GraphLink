from django.db.models import Count, Exists, OuterRef, Value
from rest_framework import serializers

from users.serializers import UserSummarySerializer
from .models import Comment, Like, Post


def annotate_posts(queryset, request):
    '''Attach like/comment counts and whether the viewer liked each post'''
    queryset = queryset.select_related("author__profile").annotate(
        like_count=Count("post_likes", distinct=True),
        comment_count=Count("comments", distinct=True),
    )
    if request.user.is_authenticated:
        return queryset.annotate(liked_by_me=Exists(
            Like.objects.filter(post=OuterRef("pk"), user=request.user)))
    return queryset.annotate(liked_by_me=Value(False))


class PostSerializer(serializers.ModelSerializer):
    author = UserSummarySerializer(read_only=True)
    like_count = serializers.IntegerField(read_only=True, default=0)
    comment_count = serializers.IntegerField(read_only=True, default=0)
    liked_by_me = serializers.BooleanField(read_only=True, default=False)
    is_mine = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = ["id", "title", "content", "date_posted", "author",
                  "like_count", "comment_count", "liked_by_me", "is_mine"]
        read_only_fields = ["date_posted"]

    def get_is_mine(self, post):
        request = self.context.get("request")
        return bool(request and request.user == post.author)

    def validate_title(self, value):
        if not value.strip():
            raise serializers.ValidationError("Give your post a title.")
        return value.strip()

    def validate_content(self, value):
        if not value.strip():
            raise serializers.ValidationError("Write something first.")
        return value.strip()


class CommentSerializer(serializers.ModelSerializer):
    author = UserSummarySerializer(read_only=True)

    class Meta:
        model = Comment
        fields = ["id", "body", "created_on", "author"]
        read_only_fields = ["created_on"]

    def validate_body(self, value):
        if not value.strip():
            raise serializers.ValidationError("Comment can't be empty.")
        return value.strip()
