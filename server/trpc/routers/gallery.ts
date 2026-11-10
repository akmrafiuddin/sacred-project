import { z } from "zod";
import { router, staffProcedure } from "../init";
import {
  createAlbumSchema,
  updateAlbumSchema,
  listAlbumsQuerySchema,
  reorderAlbumsSchema,
  createAlbumItemSchema,
  updateAlbumItemSchema,
  reorderAlbumItemsSchema,
} from "../../../shared/schemas/gallery";
import { GalleryService } from "../../services/gallery";

export const galleryRouter = router({
  // Albums
  listAlbums: staffProcedure
    .input(listAlbumsQuerySchema)
    .query(async ({ ctx, input }) => {
      return GalleryService.listAlbums(ctx.db, input);
    }),

  getAlbum: staffProcedure
    .input(z.object({ id: z.number().int() }))
    .query(async ({ ctx, input }) => {
      return GalleryService.getAlbumById(ctx.db, input.id);
    }),

  getAlbumBySlug: staffProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      return GalleryService.getAlbumBySlug(ctx.db, input.slug);
    }),

  createAlbum: staffProcedure
    .input(createAlbumSchema)
    .mutation(async ({ ctx, input }) => {
      return GalleryService.createAlbum(ctx.db, input);
    }),

  updateAlbum: staffProcedure
    .input(updateAlbumSchema)
    .mutation(async ({ ctx, input }) => {
      return GalleryService.updateAlbum(ctx.db, input);
    }),

  reorderAlbums: staffProcedure
    .input(reorderAlbumsSchema)
    .mutation(async ({ ctx, input }) => {
      return GalleryService.reorderAlbums(ctx.db, input);
    }),

  setActiveAlbum: staffProcedure
    .input(z.object({ id: z.number().int(), active: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      return GalleryService.updateAlbum(ctx.db, { id: input.id, active: input.active });
    }),

  deleteAlbum: staffProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      return GalleryService.deleteAlbum(ctx.db, input.id);
    }),

  // Album Items
  listItems: staffProcedure
    .input(z.object({ albumId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      return GalleryService.listItems(ctx.db, input.albumId);
    }),

  addItem: staffProcedure
    .input(createAlbumItemSchema)
    .mutation(async ({ ctx, input }) => {
      return GalleryService.addItem(ctx.db, input);
    }),

  updateItem: staffProcedure
    .input(updateAlbumItemSchema)
    .mutation(async ({ ctx, input }) => {
      return GalleryService.updateItem(ctx.db, input);
    }),

  reorderItems: staffProcedure
    .input(reorderAlbumItemsSchema)
    .mutation(async ({ ctx, input }) => {
      return GalleryService.reorderItems(ctx.db, input);
    }),

  deleteItem: staffProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      return GalleryService.deleteItem(ctx.db, input.id);
    }),
});
