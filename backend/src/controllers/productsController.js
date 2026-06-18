import prisma from '../config/prisma.js';

/**
 * Get all products
 */
export const getAllProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: {name: 'asc'}
    });

    return res.status(200).json({
      success: true,
      message: 'Products retrieved successfully',
      data: products,
      count: products.length
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message
    });
  }
};

/**
 * Create a new product (Admin only)
 */
export const createProduct = async (req, res) => {
  try {
    const { name, basePrice, stockQty } = req.body;

    // Validation
    if (!name || basePrice === undefined || stockQty === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Name, basePrice, and stockQty are required'
      });
    }

    if (typeof basePrice !== 'number' || basePrice < 0) {
      return res.status(400).json({
        success: false,
        message: 'basePrice must be a positive number'
      });
    }

    if (typeof stockQty !== 'number' || stockQty < 0) {
      return res.status(400).json({
        success: false,
        message: 'stockQty must be a positive number'
      });
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        basePrice: parseFloat(basePrice),
        stockQty: parseFloat(stockQty)
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    console.error('Error creating product:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating product',
      error: error.message
    });
  }
};

/**
 * Update a product (Admin only)
 */
export const putProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, basePrice, stockQty } = req.body;

    // Validation
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    if (!name && basePrice === undefined && stockQty === undefined) {
      return res.status(400).json({
        success: false,
        message: 'At least one field (name, basePrice, or stockQty) is required for update'
      });
    }

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    });

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Prepare update data
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (basePrice !== undefined) {
      if (typeof basePrice !== 'number' || basePrice < 0) {
        return res.status(400).json({
          success: false,
          message: 'basePrice must be a positive number'
        });
      }
      updateData.basePrice = parseFloat(basePrice);
    }
    if (stockQty !== undefined) {
      if (typeof stockQty !== 'number' || stockQty < 0) {
        return res.status(400).json({
          success: false,
          message: 'stockQty must be a positive number'
        });
      }
      updateData.stockQty = parseFloat(stockQty);
    }

    // Update product
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData
    });

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating product',
      error: error.message
    });
  }
};

/**
 * Delete a product (Admin only)
 */
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Validation
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    });

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Delete product
    const deletedProduct = await prisma.product.delete({
      where: { id }
    });

    return res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
      data: deletedProduct
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    
    // Handle foreign key constraint errors
    if (error.code === 'P2014' || error.code === 'P2003') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete product that is associated with deals'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error deleting product',
      error: error.message
    });
  }
};