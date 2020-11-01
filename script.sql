-- Book Swap Tables
-- Table structure for table `Books`
--
DROP TABLE IF EXISTS Books;
CREATE TABLE `Books` (
    `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `title` varchar(255) NOT NULL,
    `author` varchar(255) NOT NULL,
    `genre` varchar(255) DEFAULT NULL,
    `language` varchar(255) NOT NULL,
    `isbn` varchar(255) NOT NULL,
    `imgUrl` varchar(255) DEFAULT NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8;
-- --------------------------------------------------------
--
-- Table structure for table `Conditions`
--
DROP TABLE IF EXISTS Conditions;
CREATE TABLE `Conditions` (
    `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `description` varchar(255) NOT NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8;
-- --------------------------------------------------------
--
-- Table structure for table `Statuses`
--
DROP TABLE IF EXISTS Statuses;
CREATE TABLE `Statuses` (
    `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `description` varchar(255) NOT NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8;
-- --------------------------------------------------------
--
-- Table structure for table `TransactionStatusDates`
--
DROP TABLE IF EXISTS TransactionStatusDates;
CREATE TABLE `TransactionStatusDates` (
    `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `statusId` int(11) NOT NULL,
    `date` date NOT NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8;
-- --------------------------------------------------------
--
-- Table structure for table `Users`
--
DROP TABLE IF EXISTS Users;
CREATE TABLE `Users` (
    `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `firstName` varchar(255) NOT NULL,
    `lastName` varchar(255) NOT NULL,
    `email` varchar(255) NOT NULL UNIQUE,
    `password` varchar(255) NOT NULL,
    `tempPassword` bit DEFAULT 0,
    `address` varchar(255) DEFAULT NULL,
    `city` varchar(255) DEFAULT NULL,
    `state` varchar(255) DEFAULT NULL,
    `postalCode` varchar(255) DEFAULT NULL,
    `country` varchar(4) NOT NULL,
    `worldwide` bit NOT NULL,
    `points` int(11) DEFAULT 0
) ENGINE = InnoDB DEFAULT CHARSET = utf8;
-- --------------------------------------------------------
--
-- Table structure for table `UserBooks`
--
DROP TABLE IF EXISTS UserBooks;
CREATE TABLE `UserBooks` (
    `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `userId` int(11) NOT NULL,
    `bookId` int(11) NOT NULL,
    `conditionId` int(11) NOT NULL,
    `listingDate` date NOT NULL,
    `available` tinyint(1) NOT NULL,
    FOREIGN KEY (`userId`) REFERENCES `Users` (`id`),
    FOREIGN KEY (`bookId`) REFERENCES `Books` (`id`),
    FOREIGN KEY (`conditionId`) REFERENCES `Conditions` (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8;
-- --------------------------------------------------------
--
-- Table structure for table `Transactions`
--
DROP TABLE IF EXISTS Transactions;
CREATE TABLE `Transactions` (
    `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `userBookId` int(11) NOT NULL,
    `requestorId` int(11) NOT NULL,
    `statusId` int(11) NOT NULL,
    `rating` int(11) DEFAULT NULL,
    `pointCost` int(11) DEFAULT NULL,
    `pointReward` int(11) DEFAULT NULL,
    `estShipping` float DEFAULT NULL,
    `shipping` float DEFAULT NULL,
    `rcvdOnTime` tinyint(1) NOT NULL,
    `conditionMatched` tinyint(1) NOT NULL,
    FOREIGN KEY (`userBookId`) REFERENCES `UserBooks` (`id`),
    FOREIGN KEY (`requestorId`) REFERENCES `Users` (`id`),
    FOREIGN KEY (`statusId`) REFERENCES `Statuses` (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8;
-- --------------------------------------------------------
--
-- Table structure for table `Wishlist`
--
DROP TABLE IF EXISTS Wishlist;
CREATE TABLE `Wishlist` (
    `userId` int(11) NOT NULL,
    `bookId` int(11) NOT NULL,
    FOREIGN KEY (`userId`) REFERENCES `Users` (`id`),
    FOREIGN KEY (`bookId`) REFERENCES `Books` (`id`),
    PRIMARY KEY (`userId`, `bookId`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8;