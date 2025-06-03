/*
  Warnings:

  - The values [VENDOR] on the enum `Admin_role` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `vendorId` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `vendorId` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `vendorCommission` on the `Settings` table. All the data in the column will be lost.
  - The values [VENDOR] on the enum `Admin_role` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `vendorId` on the `WalletHistory` table. All the data in the column will be lost.
  - Added the required column `adminId` to the `OrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `adminId` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `adminId` to the `WalletHistory` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `OrderItem` DROP FOREIGN KEY `OrderItem_vendorId_fkey`;

-- DropForeignKey
ALTER TABLE `Product` DROP FOREIGN KEY `Product_vendorId_fkey`;

-- DropForeignKey
ALTER TABLE `WalletHistory` DROP FOREIGN KEY `WalletHistory_vendorId_fkey`;

-- DropIndex
DROP INDEX `OrderItem_vendorId_fkey` ON `OrderItem`;

-- DropIndex
DROP INDEX `Product_vendorId_fkey` ON `Product`;

-- DropIndex
DROP INDEX `WalletHistory_vendorId_fkey` ON `WalletHistory`;

-- AlterTable
ALTER TABLE `Admin` MODIFY `role` ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'ADMIN';

-- AlterTable
ALTER TABLE `OrderItem` DROP COLUMN `vendorId`,
    ADD COLUMN `adminId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `Product` DROP COLUMN `vendorId`,
    ADD COLUMN `adminId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `Settings` DROP COLUMN `vendorCommission`;

-- AlterTable
ALTER TABLE `User` MODIFY `role` ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER';

-- AlterTable
ALTER TABLE `WalletHistory` DROP COLUMN `vendorId`,
    ADD COLUMN `adminId` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `Admin`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `Admin`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WalletHistory` ADD CONSTRAINT `WalletHistory_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `Admin`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
