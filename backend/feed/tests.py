from django.contrib.auth.models import User
from rest_framework.test import APITestCase

from users.models import Profile
from .models import Post


class PostApiTests(APITestCase):
    def setUp(self):
        self.alice = User.objects.create_user("alice", "alice@example.com", "pw-alice-123")
        self.bob = User.objects.create_user("bob", "bob@example.com", "pw-bob-123")
        self.post = Post.objects.create(title="Hello", content="First post", author=self.alice)

    def test_anonymous_can_read_posts_and_detail(self):
        response = self.client.get("/api/posts")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)
        detail = self.client.get(f"/api/posts/{self.post.pk}")
        self.assertEqual(detail.status_code, 200)
        self.assertFalse(detail.data["liked_by_me"])

    def test_anonymous_cannot_create(self):
        response = self.client.post("/api/posts", {"title": "x", "content": "y"})
        self.assertEqual(response.status_code, 403)

    def test_create_sets_author(self):
        self.client.force_login(self.bob)
        response = self.client.post("/api/posts", {"title": " Hi ", "content": "there"})
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["author"]["username"], "bob")
        self.assertEqual(response.data["title"], "Hi")
        self.assertTrue(response.data["is_mine"])

    def test_only_author_can_edit_or_delete(self):
        self.client.force_login(self.bob)
        self.assertEqual(self.client.patch(f"/api/posts/{self.post.pk}", {"title": "no"}).status_code, 403)
        self.assertEqual(self.client.delete(f"/api/posts/{self.post.pk}").status_code, 403)
        self.client.force_login(self.alice)
        self.assertEqual(self.client.patch(f"/api/posts/{self.post.pk}", {"title": "Edited"}).status_code, 200)
        self.assertEqual(self.client.delete(f"/api/posts/{self.post.pk}").status_code, 204)

    def test_like_and_unlike(self):
        self.client.force_login(self.bob)
        liked = self.client.post(f"/api/posts/{self.post.pk}/like")
        self.assertEqual(liked.data["like_count"], 1)
        self.assertTrue(liked.data["liked_by_me"])
        again = self.client.post(f"/api/posts/{self.post.pk}/like")
        self.assertEqual(again.data["like_count"], 1)
        self.post.refresh_from_db()
        self.assertEqual(self.post.likes, 1)
        unliked = self.client.delete(f"/api/posts/{self.post.pk}/like")
        self.assertEqual(unliked.data["like_count"], 0)

    def test_featured_is_most_liked(self):
        other = Post.objects.create(title="Popular", content="!", author=self.bob)
        self.client.force_login(self.alice)
        self.client.post(f"/api/posts/{other.pk}/like")
        response = self.client.get("/api/posts/featured")
        self.assertEqual(response.data["post"]["title"], "Popular")

    def test_following_feed(self):
        Post.objects.create(title="Bob's", content="post", author=self.bob)
        carol = User.objects.create_user("carol", "c@example.com", "pw-carol-123")
        self.client.force_login(carol)
        Profile.objects.follow(carol.profile, self.alice.profile)
        response = self.client.get("/api/posts?feed=following")
        self.assertEqual([p["title"] for p in response.data["results"]], ["Hello"])

    def test_comments(self):
        self.client.force_login(self.bob)
        created = self.client.post(f"/api/posts/{self.post.pk}/comments", {"body": "Nice"})
        self.assertEqual(created.status_code, 201)
        self.assertEqual(self.client.post(f"/api/posts/{self.post.pk}/comments", {"body": "  "}).status_code, 400)
        listed = self.client.get(f"/api/posts/{self.post.pk}/comments")
        self.assertEqual([c["body"] for c in listed.data], ["Nice"])
        self.assertEqual(self.client.get(f"/api/posts/{self.post.pk}").data["comment_count"], 1)
