import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const addToCart = async (req, res) => {
  try {
    const { id } = req.user;
    const { variantId, quantity, attributes } = req.body;

    if (
      !variantId ||
      !quantity ||
      !attributes ||
      typeof attributes !== "object"
    ) {
      return res
        .status(400)
        .json({ error: "variantId, quantity, and attributes are required." });
    }

    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { attributes: true },
    });

    if (!variant) {
      return res.status(404).json({ error: "Variant not found." });
    }

    const attributeKeys = variant.attributes.map((attr) => attr.key);
    const providedKeys = Object.keys(attributes);

    for (let key of providedKeys) {
      if (!attributeKeys.includes(key)) {
        return res.status(400).json({ error: `Invalid attribute: ${key}` });
      }
    }

    let cart = await prisma.cart.findUnique({ where: { userId: id } });

    if (!cart) {
      cart = await prisma.cart.create({ data: { userId: id } });
    }

    const attributeEntries = Object.entries(attributes);

    const variantAttributes = await prisma.variantAttribute.findMany({
      where: {
        variantId,
        OR: attributeEntries.map(([key, value]) => ({ key, value })),
      },
    });

    if (variantAttributes.length !== attributeEntries.length) {
      return res.status(400).json({ error: "Invalid attribute values." });
    }

    const variantAttrIds = variantAttributes.map((attr) => attr.id);

    const existingCartItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        variantId,
        cartItemAttributes: {
          every: {
            variantAttributeId: {
              in: variantAttrIds,
            },
          },
        },
      },
    });

    if (existingCartItem) {
      const updatedItem = await prisma.cartItem.update({
        where: { id: existingCartItem.id },
        data: {
          quantity: existingCartItem.quantity + quantity,
        },
        include: {
          cartItemAttributes: true,
        },
      });

      return res.json(updatedItem);
    }

    const newCartItem = await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        variantId,
        quantity,
        price: variant.price,
        cartItemAttributes: {
          create: variantAttrIds.map((id) => ({
            variantAttribute: { connect: { id } },
          })),
        },
      },
      include: {
        cartItemAttributes: true,
      },
    });

    return res.json(newCartItem);
  } catch (error) {
    console.error("Error adding item to cart:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
export const getCartItems = async (req, res) => {
  try {
    const userId = req.user.id;

    // Retrieve the user's cart with related items
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: true,
                attributes: true,
              },
            },
            cartItemAttributes: {
              include: {
                variantAttribute: true,
              },
            },
          },
        },
      },
    });

    // If cart is empty or doesn't exist
    if (!cart || cart.items.length === 0) {
      return res.json({
        cartId: cart?.id || null,
        items: [],
        summary: {
          subtotal: 0,
          totalItems: 0,
        },
        otherCharges: {
          plateformfee: 0,
          gst: 0,
          deliveryFee: 0,
        },
        totalAmountafterCharges: 0,
      });
    }

    let subtotal = 0;

    // Format cart items
    const formattedItems = cart.items.map((item) => {
      const variant = item.variant;
      const product = variant.product;
      const images = Array.isArray(variant.images) ? variant.images : [];

      const itemTotal = Number(item.quantity) * Number(item.price);
      subtotal += itemTotal;

      return {
        cartItemId: item.id,
        productName: product.name,
        productSlug: product.slug,
        productId: product.id,
        variantId: variant.id,
        sku: variant.sku,
        price: Number(item.price),
        quantity: item.quantity,
        itemTotal,
        images,
        attributes: item.cartItemAttributes.map((attr) => ({
          key: attr.variantAttribute.key,
          value: attr.variantAttribute.value,
        })),
      };
    });

    // get charges
    const settings = await prisma.settings.findFirst({
      select: {
        plateformfee: true,
        gst: true,
        deliveryFee: true,
      },
    });

    const plateformfee = settings?.plateformfee || 0;
    const gst = settings?.gst || 0;
    const deliveryFee = settings?.deliveryFee || 0;

    const gstAmount = (subtotal * gst) / 100;
    const totalAmountafterCharges =
      subtotal + gstAmount + deliveryFee + plateformfee;

    res.json({
      cartId: cart.id,
      items: formattedItems,
      summary: {
        subtotal,
        totalItems: formattedItems.length,
      },
      otherCharges: {
        plateformfee,
        gst,
        deliveryFee,
      },
      totalAmountafterCharges,
    });
  } catch (error) {
    console.error("Error getting cart items:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateCartItemQuantity = async (req, res) => {
  try {
    const userId = req.user.id;
    const cartItemId = parseInt(req.params.Id, 10);

    const { action } = req.body;

    if (!["increment", "decrement"].includes(action)) {
      return res.status(400).json({ error: "Invalid action." });
    }

    // Fetch cart item by ID, include the cart to check ownership
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: { cart: true },
    });
    console.log(cartItem, "ersdtfyghjk");

    if (!cartItem || cartItem.cart.userId !== userId) {
      return res
        .status(404)
        .json({ error: "Cart item not found or unauthorized." });
    }

    let newQuantity =
      action === "increment" ? cartItem.quantity + 1 : cartItem.quantity - 1;

    if (newQuantity <= 0) {
      // Delete related cartItemAttributes first
      await prisma.cartItemAttribute.deleteMany({
        where: { cartItemId },
      });

      // Then delete the cart item
      await prisma.cartItem.delete({
        where: { id: cartItemId },
      });

      return res.json({ message: "Item removed from cart." });
    }

    const updatedItem = await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity: newQuantity },
    });

    res.json(updatedItem);
  } catch (error) {
    console.error("Error updating cart item quantity:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;

    // Retrieve the user's cart
    const cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      return res.status(404).json({ error: "Cart not found." });
    }

    // Delete all cart item attributes (if any)
    await prisma.cartItemAttribute.deleteMany({
      where: { cartItem: { cartId: cart.id } },
    });

    // Delete all cart items
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    res.json({ message: "Cart cleared successfully." });
  } catch (error) {
    console.error("Error clearing cart:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createOrder = async (req, res) => {
  const userId = req.user.id;
  const {
    paymentMode,
    paymentOrderId,
    orderStatus, // 'SUCCESS' | 'FAIL' | 'PENDING'
    addressId,
    gst = 0,
    discount = 0,
    couponCode = null,
    totalAmount,
    notes = null,
  } = req.body;

  try {
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            variant: {
              include: { product: true },
            },
            cartItemAttributes: {
              include: { variantAttribute: true },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: "Cart is empty." });
    }

    const orderItemsData = cart.items.map((item) => ({
      productId: item.variant.productId,
      variantId: item.variant.id,
      vendorId: item.variant.product.vendorId,
      quantity: item.quantity,
      price: item.price,
      attributes: item.cartItemAttributes.map((attr) => ({
        key: attr.variantAttribute.key,
        value: attr.variantAttribute.value,
      })),
    }));

    const order = await prisma.order.create({
      data: {
        userId,
        addressId,
        totalAmount,
        gst,
        discount,
        couponCode,
        paymentMode,
        paymentOrderId,
        orderStatus,
        status: orderStatus === "SUCCESS" ? "CONFIRMED" : "PENDING",
        notes,
        orderItems: {
          create: orderItemsData,
        },
      },
    });

    if (orderStatus === "SUCCESS") {
      await prisma.cartItemAttribute.deleteMany({
        where: {
          cartItem: {
            cartId: cart.id,
          },
        },
      });

      await prisma.cartItem.deleteMany({
        where: {
          cartId: cart.id,
        },
      });
    }

    res.status(201).json({ message: "Order created", order });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// get all orders admin
export const getAllOrdersAdmin = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        user: true,
        // address: true,
        orderItems: {
          include: {
            variant: {
              include: { product: true },
            },
          },
        },
      },
    });

    res.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// get order by id admin

export const getOrderByIdAdmin = async (req, res) => {
  const { id } = req.params;

  try {
    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: true,
        address: true,

        orderItems: {
          include: {
            vendor: true,
            variant: {
              include: { product: true },
            },
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }

    res.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// vendor

// get all orders

export const getAllOrdersVendor = async (req, res) => {
  try {
    const vendorId = req.user.id;
    if (!vendorId) {
      return res.status(400).json({ error: "Vendor ID is required." });
    }

    const orders = await prisma.order.findMany({
      where: {
        orderItems: {
          some: {
            variant: {
              product: {
                vendorId,
              },
            },
          },
        },
      },
      include: {
        user: true,
        orderItems: {
          include: {
            variant: {
              include: { product: true },
            },
          },
        },
      },
    });

    res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// get order by id vendor

export const getOrderByIdVendor = async (req, res) => {
  const { id } = req.params;

  try {
    const vendorId = req.user.id;
    if (!vendorId) {
      return res.status(400).json({ error: "Vendor ID is required." });
    }

    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: true,
        address: true,
        orderItems: {
          where: {
            variant: {
              product: {
                vendorId,
              },
            },
          },
          include: {
            variant: {
              include: { product: true },
            },
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }

    res.status(200).json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// get user orders

export const getUserOrders = async (req, res) => {
  const userId = req.user.id;
  try {
    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        orderItems: {
          include: {
            variant: {
              include: { product: true },
            },
          },
        },
      },
    });

    res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching user orders:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// get user order by id

export const getUserOrdersById = async (req, res) => {
  const userId = req.user.id;
  const { orderId } = req.params;

  try {
    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId), userId },
      include: {
        orderItems: {
          include: {
            variant: {
              include: { product: true },
            },
          },
        },
      },
    });

    if (!order || order.userId !== userId) {
      return res.status(404).json({ error: "Order not found." });
    }

    res.status(200).json(order);
  } catch (error) {
    console.error("Error fetching user order:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// update order item status vendor

export const updateOrderItemStatusVendor = async (req, res) => {
  const { OrderItemStatus, OrderItemId } = req.body;
  const OrderItemIdInt = parseInt(OrderItemId, 10);
  const vendorId = req.user.id;

  try {
    const orderItem = await prisma.orderItem.findFirst({
      where: { id: OrderItemIdInt, vendorId },
    });

    if (!orderItem) {
      return res.status(404).json({ error: "Order item not found." });
    }

    const updatedOrderItem = await prisma.orderItem.update({
      where: { id: OrderItemIdInt },
      data: { orderItemStatus: OrderItemStatus },
    });

    res.status(200).json(updatedOrderItem);
  } catch (error) {
    console.error("Error updating order item status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// update order item status admin

export const updateOrderItemStatusAdmin = async (req, res) => {
  const { OrderItemStatus, OrderItemId } = req.body;
  const OrderItemIdInt = parseInt(OrderItemId, 10);
  try {
    const orderItem = await prisma.orderItem.findUnique({
      where: { id: OrderItemIdInt },
    });

    if (!orderItem) {
      return res.status(404).json({ error: "Order item not found." });
    }

    const updatedOrderItem = await prisma.orderItem.update({
      where: { id: OrderItemIdInt },
      data: { orderItemStatus: OrderItemStatus },
    });

    res.status(200).json(updatedOrderItem);
  } catch (error) {
    console.error("Error updating order item status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
