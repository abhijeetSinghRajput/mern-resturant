import Categories from "@/components/admin/menu/Categories";
import FoodItems from "@/components/admin/menu/FoodItems";
import React, { useState } from "react";

const MenuPage = () => {
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  const handleSelectCategory = (categoryId) => {
    setSelectedCategoryId((current) =>
      current === categoryId ? null : categoryId
    );
  };

  return (
    <div className="space-y-8 p-4 md:p-6">
      <Categories
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={handleSelectCategory}
      />
      <FoodItems categoryId={selectedCategoryId} />
    </div>
  );
};

export default MenuPage;
