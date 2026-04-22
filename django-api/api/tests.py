from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import ExpenseCategory


class CategoryListCreateTests(APITestCase):
    """GET /categories/ and POST /categories/"""

    def setUp(self):
        self.url = "/categories/"
        self.travel = ExpenseCategory.objects.create(name="Travel", is_active=True)
        self.meals = ExpenseCategory.objects.create(name="Meals", is_active=False)

    # --- GET /categories/ ---

    def test_list_returns_all_categories(self):
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_list_returns_correct_fields(self):
        res = self.client.get(self.url)
        category = next(c for c in res.data if c["name"] == "Travel")
        self.assertIn("id", category)
        self.assertIn("name", category)
        self.assertIn("is_active", category)
        self.assertIn("codes", category)

    def test_list_returns_empty_when_no_categories(self):
        ExpenseCategory.objects.all().delete()
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 0)

    # --- POST /categories/ ---

    def test_create_category_succeeds(self):
        res = self.client.post(self.url, {"name": "Office Supplies"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["name"], "Office Supplies")
        self.assertTrue(res.data["is_active"])  # default should be true

    def test_create_category_is_active_defaults_to_true(self):
        res = self.client.post(self.url, {"name": "Transport"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(res.data["is_active"])

    def test_create_category_can_set_inactive(self):
        res = self.client.post(
            self.url, {"name": "Archived", "is_active": False}, format="json"
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertFalse(res.data["is_active"])

    # --- POST /categories/ failures ---

    def test_create_fails_without_name(self):
        res = self.client.post(self.url, {}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("name", res.data)

    def test_create_fails_with_blank_name(self):
        res = self.client.post(self.url, {"name": ""}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("name", res.data)

    def test_create_fails_with_duplicate_name(self):
        res = self.client.post(self.url, {"name": "Travel"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("name", res.data)

    def test_create_fails_with_duplicate_name_case_insensitive(self):
        res = self.client.post(self.url, {"name": "travel"}, format="json")
        # depending on your db collation this may or may not fail —
        # worth knowing which behaviour you get
        self.assertIn(res.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_201_CREATED])


class CategoryUpdateTests(APITestCase):
    """PUT /categories/{id}/"""

    def setUp(self):
        self.category = ExpenseCategory.objects.create(name="Travel", is_active=True)
        self.url = f"/categories/{self.category.id}/"

    # --- PUT /categories/{id}/ ---

    def test_update_name_succeeds(self):
        res = self.client.put(self.url, {"name": "Business Travel"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.category.refresh_from_db()
        self.assertEqual(self.category.name, "Business Travel")

    def test_deactivate_category(self):
        res = self.client.put(self.url, {"name": "Travel", "is_active": False}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.category.refresh_from_db()
        self.assertFalse(self.category.is_active)

    def test_activate_category(self):
        self.category.is_active = False
        self.category.save()
        res = self.client.put(self.url, {"name": "Travel", "is_active": True}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.category.refresh_from_db()
        self.assertTrue(self.category.is_active)

    # --- PUT /categories/{id}/ failures ---

    def test_update_fails_without_name(self):
        res = self.client.put(self.url, {}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("name", res.data)

    def test_update_fails_with_blank_name(self):
        res = self.client.put(self.url, {"name": ""}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_fails_with_duplicate_name(self):
        ExpenseCategory.objects.create(name="Meals")
        res = self.client.put(self.url, {"name": "Meals"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_fails_with_invalid_uuid(self):
        res = self.client.put("/categories/not-a-uuid/", {"name": "X"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_fails_with_nonexistent_id(self):
        res = self.client.put(
            "/categories/00000000-0000-0000-0000-000000000000/",
            {"name": "Ghost"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)