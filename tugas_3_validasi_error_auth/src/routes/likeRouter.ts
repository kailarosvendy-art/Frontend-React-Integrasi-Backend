import { Router } from 'express';
import { LikeController } from '../controllers/likeController.ts';

const likeRouter = Router();
const likeController = new LikeController();

likeRouter.post('/', (req, res) => {
  // #swagger.parameters['body'] = { in: 'body', required: true, schema: { $ref: '#/definitions/LikeInput' } }
  // #swagger.responses[201] = { description: 'Like berhasil dibuat dan likeCount review diperbarui' }
  // #swagger.responses[409] = { description: 'User sudah menyukai review ini' }
  return likeController.createLike(req, res);
});

likeRouter.delete('/:id', (req, res) => {
  // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer' }
  // #swagger.responses[200] = { description: 'Like berhasil dihapus dan likeCount review diperbarui' }
  // #swagger.responses[404] = { description: 'Like tidak ditemukan' }
  return likeController.deleteLike(req, res);
});

export { likeRouter };