from rest_framework import generics
from .models import ExpenseCategory, ExpenseCode
from .serializers import (
    ExpenseCategorySerializer,
    ExpenseCategoryWriteSerializer,
    ExpenseCodeSerializer,
    ExpenseCodeWriteSerializer,
)

class CategoryListCreateView(generics.ListCreateAPIView):
    queryset = ExpenseCategory.objects.all()

    def get_serializer_class(self):
        if self.request.method == "POST":
            return ExpenseCategoryWriteSerializer
        return ExpenseCategorySerializer


class CategoryUpdateView(generics.UpdateAPIView):
    queryset = ExpenseCategory.objects.all()
    serializer_class = ExpenseCategoryWriteSerializer


class CategoryCodeListCreateView(generics.ListCreateAPIView):
    serializer_class = ExpenseCodeWriteSerializer

    def get_queryset(self):
        return ExpenseCode.objects.filter(category_id=self.kwargs["pk"])

    def perform_create(self, serializer):
        serializer.save(category_id=self.kwargs["pk"])


class CodeUpdateView(generics.UpdateAPIView):
    queryset = ExpenseCode.objects.all()
    serializer_class = ExpenseCodeWriteSerializer