import React from 'react';

const MainContent: React.FC = () => {
  return (
    <main className="flex-1 p-8 flex flex-col">
      <header className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-semibold text-primary">Model Selection</h2>
        <div className="flex items-center">
          <button className="bg-accent text-white px-4 py-2 rounded-md hover:bg-opacity-80">
            Create New
          </button>
          <button className="ml-4 text-secondary hover:text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      </header>
      <div className="flex-1 bg-component rounded-lg p-6">
        <p className="text-primary">This is where the main content will go.</p>
        <p className="text-secondary mt-2">You can start by selecting a model from the list on the left.</p>
      </div>
    </main>
  );
};

export default MainContent;
