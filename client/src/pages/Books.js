import React, { useState, useEffect, lazy, Suspense } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FaSearch, FaFilter, FaTimes, FaBook, FaCube } from 'react-icons/fa';
import { getBooks, getGenres } from '../utils/api';
import ModernBookCard from '../components/books/ModernBookCard';
import FloatingCard from '../components/ui/FloatingCard';
import { FadeInItem } from '../components/animations/PageTransition';
// Lazy load the 3D bookshelf scene for better performance
const BookshelfScene = lazy(() => import('../components/3d/BookshelfScene'));

// Styled components
const PageContainer = styled.div`
  position: relative;
`;

const ViewToggleContainer = styled.div`
  position: fixed;
  top: 6rem;
  right: 2rem;
  z-index: 100;
  display: flex;
  gap: 0.5rem;
`;

const ViewToggleButton = styled.button`
  background: ${props => props.active ? '#1E5F74' : 'rgba(255, 255, 255, 0.7)'};
  color: ${props => props.active ? 'white' : '#1E5F74'};
  border: 2px solid #1E5F74;
  border-radius: 50%;
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  }
  
  svg {
    font-size: 1.2rem;
  }
`;

const ThreeDContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  z-index: 10;
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100vh;
  color: #1E5F74;
  font-size: 1.5rem;
  
  &::after {
    content: '';
    width: 50px;
    height: 50px;
    border-radius: 50%;
    border: 6px solid rgba(30, 95, 116, 0.1);
    border-top-color: #1E5F74;
    animation: spinner 1s linear infinite;
  }
  
  @keyframes spinner {
    to { transform: rotate(360deg); }
  }
`;

const PageHeader = styled(motion.div)`
  text-align: center;
  margin-bottom: 3rem;
`;

const Title = styled(motion.h1)`
  font-size: 3rem;
  color: #1E5F74;
  margin-bottom: 1rem;
  position: relative;
  display: inline-block;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -10px;
    left: 50%;
    transform: translateX(-50%);
    width: 100px;
    height: 3px;
    background: #F7567C;
    border-radius: 3px;
  }
`;

const Subtitle = styled(motion.p)`
  font-size: 1.2rem;
  color: #6C7A89;
  max-width: 600px;
  margin: 0 auto;
`;

const SearchContainer = styled(FloatingCard)`
  margin-bottom: 2.5rem;
  padding: 2rem;
`;

const FilterContainer = styled(motion.div)`
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
`;

const InputContainer = styled.div`
  display: flex;
  position: relative;
`;

const SearchInput = styled(motion.input)`
  width: 100%;
  padding: 1rem 1.5rem;
  border-radius: 50px;
  border: 1px solid rgba(108, 122, 137, 0.2);
  font-size: 1rem;
  background: rgba(255, 255, 255, 0.8);
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(30, 95, 116, 0.3);
    background: rgba(255, 255, 255, 1);
  }
`;

const SearchButton = styled(motion.button)`
  position: absolute;
  right: 5px;
  top: 5px;
  bottom: 5px;
  border-radius: 50px;
  border: none;
  background: linear-gradient(135deg, #1E5F74 0%, #133B49 100%);
  color: white;
  padding: 0 1.5rem;
  font-weight: 600;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(30, 95, 116, 0.3);
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  
  svg {
    margin-right: 0.5rem;
  }
`;

const FilterButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const FilterButton = styled(motion.button)`
  background: ${props => props.isActive ? 'rgba(30, 95, 116, 0.1)' : 'transparent'};
  border: 1px solid ${props => props.isActive ? '#1E5F74' : 'rgba(108, 122, 137, 0.2)'};
  color: ${props => props.isActive ? '#1E5F74' : '#6C7A89'};
  border-radius: 50px;
  padding: 0.6rem 1.2rem;
  font-weight: 500;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(30, 95, 116, 0.05);
    border-color: rgba(30, 95, 116, 0.3);
  }
  
  svg {
    margin-right: 0.5rem;
  }
`;

const ResetButton = styled(motion.button)`
  background: transparent;
  border: 1px solid #F7567C;
  color: #F7567C;
  border-radius: 50px;
  padding: 0.6rem 1.2rem;
  font-weight: 500;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover:not(:disabled) {
    background: rgba(247, 86, 124, 0.05);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  svg {
    margin-right: 0.5rem;
  }
`;

const SelectContainer = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #2C3E50;
`;

const Select = styled.select`
  width: 100%;
  padding: 0.8rem 1rem;
  border-radius: 12px;
  border: 1px solid rgba(108, 122, 137, 0.2);
  font-size: 0.9rem;
  background: rgba(255, 255, 255, 0.8);
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(30, 95, 116, 0.3);
    background: rgba(255, 255, 255, 1);
  }
`;

const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  margin-top: 1.5rem;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
  font-weight: 500;
  color: #2C3E50;
`;

const Checkbox = styled.input`
  margin-right: 0.5rem;
  cursor: pointer;
`;

const ResultsCount = styled(motion.div)`
  margin-bottom: 1.5rem;
  font-style: italic;
  color: #6C7A89;
`;

const BooksGrid = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 2rem;
`;

const NoResults = styled(FloatingCard)`
  padding: 3rem;
  text-align: center;
`;

const NoResultsTitle = styled.h3`
  font-size: 1.5rem;
  color: #1E5F74;
  margin-bottom: 1rem;
`;

const NoResultsText = styled.p`
  color: #6C7A89;
  margin-bottom: 0;
`;

const LoadingContainer = styled(motion.div)`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
`;

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5
    }
  }
};

// Books component
const Books = () => {
  const [books, setBooks] = useState([]);
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or '3d'
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Fetch books and genres on component mount
  useEffect(() => {
  const fetchData = async () => {
    try {
      const response = await axios.get('/api/books');
      
      // Add this debug line:
      console.log('API Response Structure:', response.data);
      
      // Handle both possible response structures:
      const booksData = response.data.data || response.data;
      setBooks(Array.isArray(booksData) ? booksData : []);
    } catch (error) {
      console.error('API Error:', error);
      setBooks([]); // Ensure books is always an array
    }
  };

  fetchData();
}, []);

  // Handle filter changes
  const handleSearch = async (e) => {
    e.preventDefault();
    
    setLoading(true);
    
    try {
      // Prepare filter object
      const filters = {
        title: searchQuery,
        genre: selectedGenre,
        available: availableOnly ? 'true' : undefined
      };
      
      const { data } = await getBooks(filters);
      setBooks(data);
    } catch (error) {
      console.error('Error searching books:', error);
      setError('Failed to search books. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Reset filters
  const resetFilters = async () => {
    setSearchQuery('');
    setSelectedGenre('');
    setAvailableOnly(false);
    
    setLoading(true);
    
    try {
      const { data } = await getBooks();
      setBooks(data);
    } catch (error) {
      console.error('Error resetting filters:', error);
      setError('Failed to reset filters. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && books.length === 0) {
    return (
      <LoadingContainer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <LoadingSpinner />
      </LoadingContainer>
    );
  }

  if (error && books.length === 0) {
    return (
      <NoResults>
        <NoResultsTitle>Error Loading Books</NoResultsTitle>
        <NoResultsText>{error}</NoResultsText>
      </NoResults>
    );
  }

  return (
    <PageContainer>
      {/* View Toggle Buttons */}
      <ViewToggleContainer>
        <ViewToggleButton 
          active={viewMode === 'grid'} 
          onClick={() => setViewMode('grid')}
          title="Grid View"
        >
          <FaBook />
        </ViewToggleButton>
        <ViewToggleButton 
          active={viewMode === '3d'} 
          onClick={() => setViewMode('3d')}
          title="3D Bookshelf View"
        >
          <FaCube />
        </ViewToggleButton>
      </ViewToggleContainer>
      
      {/* 3D Bookshelf View */}
      {viewMode === '3d' && (
        <ThreeDContainer>
          <Suspense fallback={<LoadingSpinner />}>
            <BookshelfScene books={books} />
          </Suspense>
        </ThreeDContainer>
      )}
      
      {/* Traditional Grid View */}
      {viewMode === 'grid' && (
        <>
          <PageHeader
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Title>Discover Books</Title>
            <Subtitle>Explore our vast collection and find your next literary adventure</Subtitle>
          </PageHeader>
          
          <FadeInItem delay={0.2}>
            <SearchContainer>
              <form onSubmit={handleSearch}>
                <InputContainer>
                  <SearchInput
                    type="text"
                    placeholder="Search books by title or author..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    whileFocus={{ scale: 1.01 }}
                    transition={{ duration: 0.2 }}
                  />
                  <SearchButton
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FaSearch /> {loading ? 'Searching...' : 'Search'}
                  </SearchButton>
                </InputContainer>
                
                <FilterButtons>
                  <FilterButton
                    type="button"
                    isActive={showFilters}
                    onClick={() => setShowFilters(!showFilters)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {showFilters ? <FaTimes /> : <FaFilter />} {showFilters ? 'Hide Filters' : 'Show Filters'}
                  </FilterButton>
                  
                  <ResetButton
                    type="button"
                    onClick={resetFilters}
                    disabled={loading}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Reset
                  </ResetButton>
                </FilterButtons>
                
                {showFilters && (
                  <FilterContainer
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <SelectContainer>
                      <Label htmlFor="genre">Genre</Label>
                      <Select
                        id="genre"
                        value={selectedGenre}
                        onChange={(e) => setSelectedGenre(e.target.value)}
                      >
                        <option value="">All Genres</option>
                        {genres.map(genre => (
                          <option key={genre.GenreID} value={genre.GenreID}>
                            {genre.Name}
                          </option>
                        ))}
                      </Select>
                    </SelectContainer>
                    
                    <CheckboxContainer>
                      <CheckboxLabel>
                        <Checkbox
                          type="checkbox"
                          id="availableOnly"
                          checked={availableOnly}
                          onChange={(e) => setAvailableOnly(e.target.checked)}
                        />
                        Show only available books
                      </CheckboxLabel>
                    </CheckboxContainer>
                  </FilterContainer>
                )}
              </form>
            </SearchContainer>
          </FadeInItem>
          
          <FadeInItem delay={0.3}>
            <ResultsCount
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              {books.length} books found
            </ResultsCount>
          </FadeInItem>
          
          {loading ? (
            <LoadingContainer
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <LoadingSpinner />
            </LoadingContainer>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {books.length > 0 ? (
                <BooksGrid>
                  {books.map((book, index) => (
                    <motion.div
                      key={book.BookID}
                      variants={itemVariants}
                      custom={index}
                      transition={{ delay: 0.1 * index, duration: 0.5 }}
                    >
                      <ModernBookCard book={book} />
                    </motion.div>
                  ))}
                </BooksGrid>
              ) : (
                <NoResults>
                  <NoResultsTitle>No Books Found</NoResultsTitle>
                  <NoResultsText>
                    No books match your search criteria. Try adjusting your filters or search terms.
                  </NoResultsText>
                </NoResults>
              )}
            </motion.div>
          )}
        </>
      )}
    </PageContainer>
  );
};

export default Books;
