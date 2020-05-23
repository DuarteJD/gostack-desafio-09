import { getRepository, Repository, In } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import AppError from '@shared/errors/AppError';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = this.ormRepository.create({
      name,
      price,
      quantity,
    });

    await this.ormRepository.save(product);

    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const findProduct = await this.ormRepository.findOne({
      where: {
        name,
      },
    });

    return findProduct;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const findProductsIds = products.map(product => product.id);

    const productsFound = await this.ormRepository.find({
      id: In(findProductsIds),
    });

    return productsFound;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const productIds = products.map(product => {
      return { id: product.id };
    });

    const productsFound = await this.findAllById(productIds);

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
        ...product,
        quantity: product.quantity - productInOrder.quantity,
      };
    });

    await this.ormRepository.save(productsOrder);

    return productsOrder;
  }
}

export default ProductsRepository;
