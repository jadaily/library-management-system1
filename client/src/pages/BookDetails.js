import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Row, Col, Button, Badge, Card, Alert, Tabs, Tab } from 'react-bootstrap';
import { FaStar, FaCalendarAlt, FaBookmark, FaArrowLeft, FaBook } from 'react-icons/fa';
import AuthContext from '../utils/AuthContext';
import ReviewForm from '../components/reviews/ReviewForm';
import { getBook, getBookReviews, borrowBook, createReservation } from '../utils/api';

const BookDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, currentUser } = useContext(AuthContext);
  
  const [book, setBook] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionStatus, setActionStatus] = useState({ message: '', type: '' });
  const [userReview, setUserReview] = useState(null);
  
  useEffect(() => {
    const fetchBookDetails = async () => {
      try {
        const bookRes = await getBook(id);
        setBook(bookRes.data);
        
        const reviewsRes = await getBookReviews(id);
        setReviews(reviewsRes.data.reviews);
        
        // Check if current user has already reviewed this book
        if (isAuthenticated && currentUser) {
          const foundReview = reviewsRes.data.reviews.find(
            review => review.MemberID === currentUser.id
          );
          
          if (foundReview) {
            setUserReview(foundReview);
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching book details:', error);
        setError('Failed to load book details. Please try again later.');
        setLoading(false);
      }
    };

    fetchBookDetails();
  }, [id, isAuthenticated, currentUser]);

  const handleBorrow = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    try {
      await borrowBook(id);
      setActionStatus({
        message: 'Book borrowed successfully!',
        type: 'success'
      });
      
      // Update book availability
      setBook({
        ...book,
        AvailableCopies: book.AvailableCopies - 1
      });
      
      // Hide message after 5 seconds
      setTimeout(() => {
        setActionStatus({ message: '', type: '' });
      }, 5000);
    } catch (error) {
      console.error('Error borrowing book:', error);
      setActionStatus({
        message: error.response?.data?.message || 'Failed to borrow book. Please try again.',
        type: 'danger'
      });
    }
  };

  const handleReserve = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    try {
      await createReservation(id);
      setActionStatus({
        message: 'Book reserved successfully! You will be notified when it becomes available.',
        type: 'success'
      });
      
      // Hide message after 5 seconds
      setTimeout(() => {
        setActionStatus({ message: '', type: '' });
      }, 5000);
    } catch (error) {
      console.error('Error reserving book:', error);
      setActionStatus({
        message: error.response?.data?.message || 'Failed to reserve book. Please try again.',
        type: 'danger'
      });
    }
  };

  const handleReviewSubmitted = async () => {
    try {
      const reviewsRes = await getBookReviews(id);
      setReviews(reviewsRes.data.reviews);
      
      // Find user's review in updated reviews
      if (isAuthenticated && currentUser) {
        const foundReview = reviewsRes.data.reviews.find(
          review => review.MemberID === currentUser.id
        );
        
        if (foundReview) {
          setUserReview(foundReview);
        }
      }
      
      setActionStatus({
        message: 'Review submitted successfully!',
        type: 'success'
      });
      
      // Hide message after 5 seconds
      setTimeout(() => {
        setActionStatus({ message: '', type: '' });
      }, 5000);
    } catch (error) {
      console.error('Error refreshing reviews:', error);
    }
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="alert alert-danger my-5" role="alert">
        {error || 'Book not found.'}
        <div className="mt-3">
          <Button as={Link} to="/books" variant="primary">
            <FaArrowLeft className="me-2" /> Back to Books
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="my-4 book-details-page">
      <Button as={Link} to="/books" variant="outline-primary" className="back-button mb-4">
        <FaArrowLeft className="me-2" /> Back to Books
      </Button>
      
      {actionStatus.message && (
        <Alert variant={actionStatus.type} className="action-alert mb-4">
          {actionStatus.message}
        </Alert>
      )}
      
      <Card className="book-detail-card mb-4">
        <Card.Body>
          <Row>
            <Col md={3} className="text-center mb-4 mb-md-0">
              <div className="book-cover-container">
                <img 
                  src={book.coverImage || "https://via.placeholder.com/300x400?text=No+Cover"} 
                  alt={book.Title} 
                  className="book-cover-image"
                />
                {book.AvailableCopies > 0 && (
                  <div className="book-status-ribbon">
                    <span>Available Now</span>
                  </div>
                )}
              </div>
            </Col>
            <Col md={9}>
              <h1 className="book-title">{book.Title}</h1>
              <h4 className="book-author mb-3">by {book.AuthorFirstName} {book.AuthorLastName}</h4>
              
              <div className="book-metadata mb-3">
                <Badge bg="secondary" className="genre-badge me-2">{book.Genre}</Badge>
                <Badge bg="info" className="year-badge">{book.PublicationYear}</Badge>
              </div>
              
              <div className="book-rating mb-3">
                <FaStar className="rating-icon me-1" /> 
                <span className="rating-value me-2">{book.averageRating ? Number(book.averageRating).toFixed(1) : 'No ratings'}</span>
                <span className="rating-count">({book.numberOfReviews || 0} reviews)</span>
              </div>
              
              <dl className="book-details-list row mb-4">
                <dt className="col-sm-3">ISBN</dt>
                <dd className="col-sm-9">{book.ISBN}</dd>
                
                <dt className="col-sm-3">Publisher</dt>
                <dd className="col-sm-9">{book.Publisher}</dd>
                
                <dt className="col-sm-3">Edition</dt>
                <dd className="col-sm-9">{book.Edition || 'N/A'}</dd>
                
                <dt className="col-sm-3">Availability</dt>
                <dd className="col-sm-9">
                  {book.AvailableCopies > 0 ? (
                    <span className="availability-tag available">Available</span>
                  ) : (
                    <span className="availability-tag unavailable">Not Available</span>
                  )}
                  <span className="ms-2 availability-count">
                    {book.AvailableCopies} of {book.TotalCopies} copies available
                  </span>
                </dd>
                
                <dt className="col-sm-3">Location</dt>
                <dd className="col-sm-9 book-location">
                  {book.Location}, {book.BranchName}
                </dd>
              </dl>
              
              <div className="book-actions mb-3">
                {book.AvailableCopies > 0 ? (
                  <Button 
                    variant="primary" 
                    className="borrow-button me-3"
                    onClick={handleBorrow}
                    disabled={!isAuthenticated}
                  >
                    <FaBook className="me-2" /> Borrow This Book
                  </Button>
                ) : (
                  <Button 
                    variant="outline-primary" 
                    className="reserve-button me-3"
                    onClick={handleReserve}
                    disabled={!isAuthenticated}
                  >
                    <FaBookmark className="me-2" /> Reserve This Book
                  </Button>
                )}
                
                {!isAuthenticated && (
                  <div className="authentication-prompt mt-2">
                    <Link to="/login" className="auth-link">Login</Link> or <Link to="/register" className="auth-link">Register</Link> to borrow or reserve
                  </div>
                )}
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      <Tabs defaultActiveKey="details" className="book-tabs mb-4">
        <Tab eventKey="details" title="Details" className="book-tab">
          <Card className="details-card">
            <Card.Body>
              <h4 className="section-title mb-3">About the Book</h4>
              <p className="book-description">
                {book.Description || 'No description available for this book.'}
              </p>
              
              <h4 className="section-title mb-3 mt-4">About the Author</h4>
              <p className="author-bio">
                {book.AuthorBio || `No biographical information available for ${book.AuthorFirstName} ${book.AuthorLastName}.`}
              </p>
            </Card.Body>
          </Card>
        </Tab>
        
        <Tab eventKey="reviews" title={`Reviews (${reviews.length})`} className="book-tab">
          <Card className="reviews-card">
            <Card.Body>
              {isAuthenticated && !userReview && (
                <div className="review-form-container">
                  <h4 className="section-title mb-3">Share Your Thoughts</h4>
                  <ReviewForm 
                    bookId={book.BookID} 
                    onReviewSubmitted={handleReviewSubmitted} 
                  />
                </div>
              )}
              
              {isAuthenticated && userReview && (
                <div className="review-form-container mb-4">
                  <h4 className="section-title mb-3">Edit Your Review</h4>
                  <ReviewForm 
                    bookId={book.BookID} 
                    existingReview={userReview}
                    onReviewSubmitted={handleReviewSubmitted} 
                  />
                </div>
              )}
              
              <h4 className="section-title mb-3">Reader Reviews</h4>
              
              {reviews.length === 0 ? (
                <div className="no-reviews-message">
                  No reviews yet. Be the first to review this book!
                </div>
              ) : (
                <div className="reviews-list">
                  {reviews.map(review => (
                    <Card key={review.ReviewID} className="review-card mb-3">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <h5 className="reviewer-name mb-0">{review.FirstName} {review.LastName}</h5>
                          <div className="star-rating">
                            {[...Array(5)].map((_, i) => (
                              <FaStar 
                                key={i} 
                                className="star-icon"
                                color={i < review.Rating ? '#F9A602' : '#e4e5e9'} 
                              />
                            ))}
                          </div>
                        </div>
                        <p className="review-date mb-3">
                          <FaCalendarAlt className="calendar-icon me-1" /> 
                          {new Date(review.ReviewDate).toLocaleDateString()}
                        </p>
                        <p className="review-text mb-0">{review.ReviewText}</p>
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Tab>
        
        <Tab eventKey="related" title="Related Books" className="book-tab">
          <Card className="related-books-card">
            <Card.Body>
              <h4 className="section-title mb-3">You might also enjoy</h4>
              
              {book.relatedBooks && book.relatedBooks.length > 0 ? (
                <Row className="related-books-container">
                  {book.relatedBooks.map(relatedBook => (
                    <Col md={4} key={relatedBook.BookID} className="mb-3">
                      <Card className="related-book-card">
                        <Card.Body>
                          <Card.Title as={Link} to={`/books/${relatedBook.BookID}`} className="related-book-title">
                            {relatedBook.Title}
                          </Card.Title>
                          <Card.Text className="related-book-author mb-2">
                            {relatedBook.AuthorFirstName} {relatedBook.AuthorLastName}
                          </Card.Text>
                          <Card.Text className="related-book-year mb-2">
                            Published: {relatedBook.PublicationYear}
                          </Card.Text>
                          <Card.Text className="related-book-availability">
                            {relatedBook.AvailableCopies > 0 ? (
                              <Badge bg="success" className="availability-badge">Available</Badge>
                            ) : (
                              <Badge bg="danger" className="availability-badge">Not Available</Badge>
                            )}
                          </Card.Text>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              ) : (
                <div className="no-related-books">
                  No related books found.
                </div>
              )}
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
    </div>
  );
};

export default BookDetails;
