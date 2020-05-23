import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateProductService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,

    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,

    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);
    if (!customer) {
      throw new AppError('Customer not found!');
    }

    const productIds = products.map(product => {
      return { id: product.id };
    });

    const productsFound = await this.productsRepository.findAllById(productIds);

    if (productsFound.length !== products.length) {
      throw new AppError('Product not found!');
    }

    const productsOrder = productsFound.map(product => {
      const productInOrder = products.find(
        productFind => productFind.id === product.id,
      );

      if (!productInOrder) {
        throw new AppError('Product not found!');
      }

      if (product.quantity < productInOrder.quantity) {
        throw new AppError('Product with insuficient quantity!');
      }

      return {
        product_id: product.id,
        quantity: productInOrder.quantity,
        price: product.price,
      };
    });

    const order = await this.ordersRepository.create({
      customer,
      products: productsOrder,
    });

    await this.productsRepository.updateQuantity(products);

    return order;
  }
}

export default CreateProductService;
