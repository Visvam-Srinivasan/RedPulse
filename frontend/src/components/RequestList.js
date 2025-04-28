import React, { useState } from 'react';

const RequestCard = ({ request, onAccept, onCancel }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAccept = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await onAccept(request._id);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            {request.bloodType} Blood Request
          </h3>
          <p className="text-sm text-gray-600">
            {request.unitsLeft} of {request.totalUnits} units left
          </p>
          <p className="text-sm text-gray-600">
            Status: {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
          </p>
        </div>
        <div className="flex space-x-2">
          {request.status === 'pending' && request.unitsLeft > 0 && (
            <button
              onClick={handleAccept}
              disabled={isLoading}
              className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 disabled:opacity-50"
            >
              {isLoading ? 'Accepting...' : 'Accept'}
            </button>
          )}
          {request.status === 'pending' && (
            <button
              onClick={() => onCancel(request._id)}
              className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-blue-500 text-sm mt-2 hover:underline"
      >
        {isExpanded ? 'Show Less' : 'Show More'}
      </button>
      {isExpanded && (
        <div className="mt-2 text-sm text-gray-600">
          <p>Location: {request.location.address}</p>
          <p>Created: {new Date(request.createdAt).toLocaleString()}</p>
          {request.fulfilledAt && (
            <p>Fulfilled: {new Date(request.fulfilledAt).toLocaleString()}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default RequestCard; 