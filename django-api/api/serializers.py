from rest_framework import serializers
from .models import ExpenseCategory, ExpenseCode

class ExpenseCodeSerializer(serializers.ModelSerializer):
    category_id = serializers.UUIDField(source="category.id", read_only=True)

    class Meta:
        model = ExpenseCode
        fields = ["id", "category_id", "code", "description", "is_active"]

class ExpenseCodeWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExpenseCode
        fields = ["id", "code", "description", "is_active"]
        extra_kwargs = {"id": {"read_only": True}}

class ExpenseCategorySerializer(serializers.ModelSerializer):
    codes = ExpenseCodeSerializer(many=True, read_only=True)

    class Meta:
        model = ExpenseCategory
        fields = ["id", "name", "is_active", "codes"]

class ExpenseCategoryWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExpenseCategory
        fields = ["id", "name", "is_active"]
        extra_kwargs = {"id": {"read_only": True}}