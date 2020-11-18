-- Book Swap Tables
-- Table structure for table Books
--
DROP TABLE IF EXISTS Books;
CREATE TABLE Books (
    id int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    title varchar(255) NOT NULL,
    author varchar(255) NOT NULL,
    genre varchar(255) NULL,
    language varchar(255) NULL,
    isbn13 varchar(255) NULL,
    isbn10 varchar(255) NULL,
    imgUrl varchar(255) DEFAULT NULL,
    rating int(11) DEFAULT NULL,
    pubDate date DEFAULT NULL,
    pageCount int(11) DEFAULT NULL
);
-- --------------------------------------------------------
--
-- Table structure for table Conditions
--
DROP TABLE IF EXISTS Conditions;
CREATE TABLE Conditions (
    id int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    description varchar(255) NOT NULL
);
INSERT INTO Conditions(id, description) VALUES (1, 'Poor'), (2, 'Fair'), (3, 'Good'), (4, 'Excellent');

-- --------------------------------------------------------
--
-- Table structure for table Statuses
--
DROP TABLE IF EXISTS Statuses;
CREATE TABLE Statuses (
    id int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    description varchar(255) NOT NULL
);
INSERT INTO `Statuses` (`id`, `description`) VALUES
(1, 'Requested'),
(2, 'Approved'),
(3, 'Shipped'),
(4, 'Received'),
(5, 'Rejected'),
(6, 'Canceled'),
(7, 'Lost'),
(8, 'Closed');
-- --------------------------------------------------------
--
-- Table structure for table TransactionStatusDates
--
DROP TABLE IF EXISTS TransactionStatusDates;
CREATE TABLE TransactionStatusDates (
    transactionId int(11) NOT NULL,
    statusId int(11) NOT NULL,
    date date NOT NULL,
    FOREIGN KEY (transactionId) REFERENCES Transactions (id),
    FOREIGN KEY (statusId) REFERENCES Statuses (id)
);
-- --------------------------------------------------------
--
-- Table structure for table Users
--
DROP TABLE IF EXISTS Users;
CREATE TABLE Users (
    id int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    firstName varchar(255) NOT NULL,
    lastName varchar(255) NOT NULL,
    email varchar(255) NOT NULL UNIQUE,
    password varchar(255) NOT NULL,
    tempPassword bit DEFAULT 0,
    address varchar(255) DEFAULT NULL,
    city varchar(255) DEFAULT NULL,
    state varchar(255) DEFAULT NULL,
    postalCode varchar(255) DEFAULT NULL,
    country varchar(4) NOT NULL,
    worldwide bit NOT NULL,
    aboutMe text DEFAULT NULL,
    points int(11) DEFAULT 0
);
-- --------------------------------------------------------
--
-- Table structure for table UserBooks
--
DROP TABLE IF EXISTS UserBooks;
CREATE TABLE UserBooks (
    id int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    userId int(11) NOT NULL,
    bookId int(11) NOT NULL,
    conditionId int(11) NOT NULL,
    listingDate date NOT NULL,
    available bit NOT NULL,
    FOREIGN KEY (userId) REFERENCES Users (id),
    FOREIGN KEY (conditionId) REFERENCES Conditions (id),
    FOREIGN KEY (bookId) REFERENCES Books (id)
);
-- --------------------------------------------------------
--
-- Table structure for table Transactions
--
DROP TABLE IF EXISTS Transactions;
CREATE TABLE Transactions (
    id int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    userBookId int(11) NOT NULL,
    requestorId int(11) NOT NULL,
    statusId int(11) NOT NULL,
    pointCost int(11) NOT NULL,
    rcvdOnTime bit DEFAULT NULL,
    conditionMatched bit DEFAULT NULL,
    rating int(11) DEFAULT NULL,
    created date NOT NULL,
    modified date DEFAULT NULL,
    FOREIGN KEY (userBookId) REFERENCES UserBooks (id),
    FOREIGN KEY (requestorId) REFERENCES Users (id),
    FOREIGN KEY (statusId) REFERENCES Statuses (id)
);
-- --------------------------------------------------------
--
-- Table structure for table Wishlist
--
DROP TABLE IF EXISTS Wishlist;
CREATE TABLE Wishlist (
    userId int(11) NOT NULL,
    bookId int(11) NOT NULL,
    FOREIGN KEY (userId) REFERENCES Users (id),
    FOREIGN KEY (bookId) REFERENCES Books (id),
    PRIMARY KEY (userId, bookId)
);
