export const getProductsService = async (productId: string) => {
  try {
    if (productId) {
      return await $fetch(`/api/admin/products?id=${productId}`);
    }

    return await $fetch('/api/admin/products');
  } catch (error) {
    console.log('Error -> ', error);
  }
};
export const createProductService = async (productData: any) => {
  try {
    return await $fetch('/api/admin/products', {
      method: 'POST',
      body: productData,
    });
  } catch (error) {
    console.log('Error service ---> ', error);
  }
};
export const deleteProductService = async (productId: any) => {
  try {
    return await $fetch('/api/admin/products', {
      method: 'DELETE',
      body: { id: productId },
    });
  } catch (error) {
    console.log('Error service ---> ', error);
  }
};
