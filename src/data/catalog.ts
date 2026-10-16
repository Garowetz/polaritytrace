import type { Catalog } from '../engine/types';
import { cassettes } from './cassettes';
import { cords } from './cords';
import { optics } from './optics';
import { trunks } from './trunks';

export const catalog: Catalog = { trunks, cassettes, cords, optics };
