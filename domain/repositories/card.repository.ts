import { DivinationCard } from '@domain/entities/card.entity';

/**
 * Card Repository Port - Interface contract for card data access
 * Decouples domain from infrastructure persistence
 */
export interface ICardRepository {
  getAllCards(): DivinationCard[];
}
