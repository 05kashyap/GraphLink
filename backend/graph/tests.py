from django.contrib.auth.models import User
from rest_framework.test import APITestCase

from users.models import Profile


def follow(follower, target):
    Profile.objects.follow(follower.profile, target.profile)


class RecommendationTests(APITestCase):
    '''
    Two clusters joined through `hub`:

        a <-> b <-> hub <-> c <-> d       (plus loner, who has no edges)
    '''
    def setUp(self):
        self.users = {name: User.objects.create_user(name, f"{name}@example.com", "pw-test-123")
                      for name in ["a", "b", "hub", "c", "d", "loner"]}
        u = self.users
        for x, y in [("a", "b"), ("b", "hub"), ("hub", "c"), ("c", "d")]:
            follow(u[x], u[y])
            follow(u[y], u[x])

    def recommendations_for(self, name):
        self.client.force_login(self.users[name])
        response = self.client.get("/api/recommendations")
        self.assertEqual(response.status_code, 200)
        return response.data

    def test_requires_login(self):
        self.assertEqual(self.client.get("/api/recommendations").status_code, 403)

    def test_case_1_cold_start(self):
        data = self.recommendations_for("loner")
        self.assertEqual(data["case"], 1)
        reasons = {s["user"]["username"]: {r["key"] for r in s["reasons"]} for s in data["suggestions"]}
        self.assertIn("hub", reasons)
        self.assertIn("bridge", reasons["hub"])
        self.assertEqual(data["follow_back"], [])

    def test_case_2_articulation_point(self):
        data = self.recommendations_for("hub")
        self.assertEqual(data["case"], 2)
        names = {s["user"]["username"] for s in data["suggestions"]}
        self.assertNotIn("hub", names)
        self.assertFalse(names & {"b", "c"}, "already-followed users are never suggested")

    def test_case_3_friend_of_friend(self):
        # a is not a cut vertex (it is a leaf), so it gets friends of friends
        data = self.recommendations_for("a")
        self.assertEqual(data["case"], 3)
        by_name = {s["user"]["username"]: s for s in data["suggestions"]}
        self.assertIn("hub", by_name)
        self.assertIn("friend_of_friend", {r["key"] for r in by_name["hub"]["reasons"]})
        self.assertEqual(by_name["hub"]["via"], ["b"])

    def test_follow_back(self):
        follow(self.users["loner"], self.users["a"])
        data = self.recommendations_for("a")
        self.assertEqual([u["username"] for u in data["follow_back"]], ["loner"])
        self.assertNotIn("loner", {s["user"]["username"] for s in data["suggestions"]})


class GraphPayloadTests(APITestCase):
    def test_payload_shape(self):
        a = User.objects.create_user("a", "a@example.com", "pw-test-123")
        b = User.objects.create_user("b", "b@example.com", "pw-test-123")
        User.objects.create_user("c", "c@example.com", "pw-test-123")
        follow(a, b)
        data = self.client.get("/api/graph").data
        self.assertEqual(data["stats"]["nodes"], 3)
        self.assertEqual(data["stats"]["edges"], 1)
        self.assertEqual(data["links"], [{"source": "a", "target": "b"}])
        node = {n["id"]: n for n in data["nodes"]}["b"]
        self.assertEqual(node["in_degree"], 1)
        self.assertEqual(set(node), {"id", "community", "degree", "in_degree", "out_degree",
                                     "eigenvector", "is_articulation"})

    def test_empty_graph(self):
        User.objects.create_user("solo", "s@example.com", "pw-test-123")
        data = self.client.get("/api/graph").data
        self.assertEqual(data["stats"]["communities"], 1)
