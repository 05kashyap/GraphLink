from django.contrib.auth.models import User
from django.core import mail
from rest_framework.test import APITestCase


class AuthApiTests(APITestCase):
    def test_register_logs_in(self):
        response = self.client.post("/api/auth/register", {
            "username": "dana", "email": "dana@example.com",
            "password1": "a-strong-pass-42", "password2": "a-strong-pass-42",
        })
        self.assertEqual(response.status_code, 201)
        self.assertEqual(self.client.get("/api/auth/me").data["user"]["username"], "dana")

    def test_register_reports_field_errors(self):
        response = self.client.post("/api/auth/register", {
            "username": "dana", "email": "not-an-email", "password1": "x", "password2": "y",
        })
        self.assertEqual(response.status_code, 400)
        self.assertIn("email", response.data)
        self.assertIn("password2", response.data)

    def test_login_logout(self):
        User.objects.create_user("erin", "erin@example.com", "pw-erin-123")
        self.assertEqual(self.client.post("/api/auth/login", {"username": "erin", "password": "bad"}).status_code, 400)
        self.assertEqual(self.client.post("/api/auth/login", {"username": "erin", "password": "pw-erin-123"}).status_code, 200)
        self.client.post("/api/auth/logout")
        self.assertIsNone(self.client.get("/api/auth/me").data["user"])

    def test_password_reset_flow(self):
        User.objects.create_user("fran", "fran@example.com", "pw-fran-123")
        self.client.post("/api/auth/password-reset", {"email": "fran@example.com"})
        self.assertEqual(len(mail.outbox), 1)
        link = [line for line in mail.outbox[0].body.splitlines() if "/reset/" in line][0]
        uid, token = link.rstrip("/").split("/")[-2:]
        response = self.client.post("/api/auth/password-reset/confirm", {
            "uid": uid, "token": token,
            "new_password1": "brand-new-pass-77", "new_password2": "brand-new-pass-77",
        })
        self.assertEqual(response.status_code, 200)
        self.assertTrue(User.objects.get(username="fran").check_password("brand-new-pass-77"))

    def test_update_profile(self):
        user = User.objects.create_user("gus", "gus@example.com", "pw-gus-123")
        self.client.force_login(user)
        response = self.client.patch("/api/auth/me", {"username": "gus2", "email": "g@example.com"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["user"]["username"], "gus2")


class FollowApiTests(APITestCase):
    def setUp(self):
        self.alice = User.objects.create_user("alice", "a@example.com", "pw-alice-123")
        self.bob = User.objects.create_user("bob", "b@example.com", "pw-bob-123")

    def test_follow_requires_login(self):
        self.assertEqual(self.client.post("/api/users/bob/follow").status_code, 403)

    def test_follow_unfollow(self):
        self.client.force_login(self.alice)
        followed = self.client.post("/api/users/bob/follow")
        self.assertTrue(followed.data["is_following"])
        self.assertEqual(followed.data["follower_count"], 1)
        self.assertEqual([u["username"] for u in self.client.get("/api/users/alice/following").data["results"]], ["bob"])
        unfollowed = self.client.delete("/api/users/bob/follow")
        self.assertFalse(unfollowed.data["is_following"])

    def test_cannot_follow_self(self):
        self.client.force_login(self.alice)
        self.assertEqual(self.client.post("/api/users/alice/follow").status_code, 400)

    def test_get_follow_is_not_allowed(self):
        self.client.force_login(self.alice)
        self.assertEqual(self.client.get("/api/users/bob/follow").status_code, 405)
