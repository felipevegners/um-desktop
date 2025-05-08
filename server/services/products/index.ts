export const getProductsService = async (productId: string) => {
  try {
    if (productId) {
      return await $fetch(`/api/admin/products?id=${productId}`);
    }

    return await $fetch('/api/admin/products');
  } catch (error) {
    throw error;
  }
};
export const createProductService = async (productData: any) => {
  try {
    return await $fetch('/api/admin/products', {
      method: 'POST',
      body: productData,
    });
  } catch (error) {
    throw error;
  }
};
export const updtateProductService = async (productData: any) => {
  try {
    return await $fetch('/api/admin/products', {
      method: 'PUT',
      body: productData,
    });
  } catch (error) {
    throw error;
  }
};
export const deleteProductService = async (productId: any) => {
  try {
    return await $fetch('/api/admin/products', {
      method: 'DELETE',
      body: { id: productId },
    });
  } catch (error) {
    throw error;
  }
};
