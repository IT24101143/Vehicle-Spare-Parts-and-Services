import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiDownload, FiTruck } from 'react-icons/fi';

const AdminWarranty = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [downloadingInvoice, setDownloadingInvoice] = useState(null);
  const [downloadingCard, setDownloadingCard] = useState(null);
  const [updateForm, setUpdateForm] = useState({
    status: '', resolution: '', adminNotes: '', replacementTrackingNumber: '', replacementNotes: ''
  });

  useEffect(() => {
    fetchClaims();
  }, [filter]);

  const fetchClaims = async () => {
    try {
      const params = filter ? { status: filter } : {};
      const response = await api.get('/warranty', { params });
      setClaims(response.data.claims);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handeAction = async (claimId, action) => {
    let status = '';
    let resolution = '';

    if (action === 'approve') {
      status = 'approved';
      resolution = 'replacement';
    } else if (action === 'reject') {
      status = 'rejected';
      resolution = 'rejected';
    } else if (action === 'review') {
      status = 'under_review';
    }

    try {
      await api.put(`/warranty/${claimId}/status`, { status, resolution });
      toast.success(`Claim ${action}ed`);
      fetchClaims();
      setSelectedClaim(null);
    } catch (error) {
      toast.error(`Error performing ${action}`);
    }
  };

  const handleUpdate = async () => {
    try {
      await api.put(`/warranty/${selectedClaim._id}/status`, updateForm);
      toast.success('Claim updated');
      setSelectedClaim(null);
      fetchClaims();
    } catch (error) {
      toast.error('Error updating claim');
    }
  };

  const handleDownloadInvoice = async (claimId, claimNumber) => {
    setDownloadingInvoice(claimId);
    try {
      const response = await api.get(`/warranty/${claimId}/invoice`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `warranty-invoice-${claimNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Invoice downloaded');
    } catch (error) {
      toast.error('Failed to download invoice');
    } finally {
      setDownloadingInvoice(null);
    }
  };

  const handleDownloadCard = async (claimId, claimNumber) => {
    setDownloadingCard(claimId);
    try {
      const response = await api.get(`/warranty/${claimId}/card`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `warranty-card-${claimNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Warranty card downloaded');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to download warranty card');
    } finally {
      setDownloadingCard(null);
    }
  };

  const openUpdateModal = (claim) => {
    setSelectedClaim(claim);
    setUpdateForm({
      status: claim.status,
      resolution: claim.resolution || '',
      adminNotes: claim.adminNotes || '',
      replacementTrackingNumber: claim.replacementTrackingNumber || '',
      replacementNotes: ''
    });
  };

  const statusOptions = ['pending', 'under_review', 'approved', 'rejected', 'replacement_sent', 'completed'];
  const resolutionOptions = ['replacement', 'repair', 'refund', 'rejected'];

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-900/30 text-yellow-400 border border-yellow-700/50',
      under_review: 'bg-blue-900/30 text-blue-400 border border-blue-700/50',
      approved: 'bg-green-900/30 text-green-400 border border-green-700/50',
      rejected: 'bg-red-900/30 text-red-400 border border-red-700/50',
      replacement_sent: 'bg-purple-900/30 text-purple-400 border border-purple-700/50',
      completed: 'bg-green-900/30 text-green-400 border border-green-700/50',
    };
    return colors[status] || 'bg-dark-700/40 text-dark-300';
  };

  const getReplacementStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-900/30 text-yellow-400';
      case 'shipped': return 'bg-blue-900/30 text-blue-400';
      case 'delivered': return 'bg-green-900/30 text-green-400';
      case 'failed': return 'bg-red-900/30 text-red-400';
      default: return 'bg-dark-700/40 text-dark-300';
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Warranty Claims</h1>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="input-field w-48">
            <option value="">All Claims</option>
            {statusOptions.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <div className="bg-dark-800/40 backdrop-blur-xl rounded-2xl border border-dark-700/50 overflow-hidden">
            <table className="w-full">
              <thead className="bg-dark-800/60">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-400 uppercase">Claim</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-400 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-400 uppercase">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-400 uppercase">Issue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-400 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700/50">
                {claims.map((claim) => (
                  <tr key={claim._id} className="hover:bg-dark-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-white">{claim.claimNumber}</p>
                      <p className="text-xs text-dark-400">{new Date(claim.createdAt).toLocaleDateString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white">{claim.user?.name}</p>
                      <p className="text-sm text-dark-400">{claim.user?.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white">{claim.product?.name}</p>
                      <p className="text-sm text-dark-400">Order: {claim.order?.orderNumber}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="capitalize text-sm text-dark-300">{claim.issueType?.replace('_', ' ')}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full capitalize ${getStatusColor(claim.status)}`}>
                        {claim.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button onClick={() => openUpdateModal(claim)} className="text-primary-400 hover:text-primary-300 transition-colors">
                          Manage
                        </button>
                        <button
                          onClick={() => handleDownloadInvoice(claim._id, claim.claimNumber)}
                          disabled={downloadingInvoice === claim._id}
                          className="text-dark-400 hover:text-white transition-colors"
                          title="Download Invoice"
                        >
                          <FiDownload className={downloadingInvoice === claim._id ? 'animate-bounce' : ''} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Update Modal */}
        {selectedClaim && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-900 border border-dark-700/50 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto backdrop-blur-xl">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Update Warranty Claim</h2>
                    <p className="text-dark-400">{selectedClaim.claimNumber}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {['approved', 'replacement_sent', 'completed'].includes(selectedClaim.status) && (
                      <button
                        onClick={() => handleDownloadCard(selectedClaim._id, selectedClaim.claimNumber)}
                        disabled={downloadingCard === selectedClaim._id}
                        className="flex items-center gap-2 px-3 py-1.5 bg-dark-700/50 hover:bg-dark-700 text-dark-300 hover:text-white border border-dark-600 rounded-lg text-sm transition-colors"
                      >
                        <FiDownload className={downloadingCard === selectedClaim._id ? 'animate-bounce' : ''} />
                        Card
                      </button>
                    )}
                    <button
                      onClick={() => handleDownloadInvoice(selectedClaim._id, selectedClaim.claimNumber)}
                      disabled={downloadingInvoice === selectedClaim._id}
                      className="flex items-center gap-2 px-3 py-1.5 bg-dark-700/50 hover:bg-dark-700 text-dark-300 hover:text-white border border-dark-600 rounded-lg text-sm transition-colors"
                    >
                      <FiDownload className={downloadingInvoice === selectedClaim._id ? 'animate-bounce' : ''} />
                      Invoice
                    </button>
                  </div>
                </div>

                <div className="bg-dark-800/40 border border-dark-700/50 p-4 rounded-xl mb-4">
                  <p className="text-sm"><span className="font-medium text-dark-300">Product:</span> <span className="text-white">{selectedClaim.product?.name}</span></p>
                  <p className="text-sm mt-1"><span className="font-medium text-dark-300">Issue:</span> <span className="text-dark-200">{selectedClaim.issueDescription}</span></p>
                  <p className="text-sm mt-1">
                    <span className="font-medium text-dark-300">Warranty Period:</span>{' '}
                    <span className="text-white">
                      {new Date(selectedClaim.warrantyStartDate).toLocaleDateString()} -{' '}
                      {new Date(selectedClaim.warrantyEndDate).toLocaleDateString()}
                    </span>
                  </p>
                </div>

                {selectedClaim.images && selectedClaim.images.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-dark-300 mb-2">Customer Photos</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedClaim.images.map((img, idx) => (
                        <a
                          key={idx}
                          href={img}
                          target="_blank"
                          rel="noreferrer"
                          className="block border border-dark-600/60 rounded-lg overflow-hidden"
                          title="Open image"
                        >
                          <img src={img} alt={`Claim ${selectedClaim.claimNumber} ${idx + 1}`} className="w-20 h-20 object-cover" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Replacement History */}
                {selectedClaim.replacementHistory && selectedClaim.replacementHistory.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-dark-300 mb-2 flex items-center gap-2">
                      <FiTruck /> Previous Replacements ({selectedClaim.replacementHistory.length})
                    </h3>
                    <div className="bg-dark-800/40 border border-dark-700/50 rounded-xl p-3 space-y-2 max-h-32 overflow-y-auto">
                      {selectedClaim.replacementHistory.map((replacement, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span className="text-white">{replacement.trackingNumber || 'No tracking'}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-dark-400">{replacement.shippedAt ? new Date(replacement.shippedAt).toLocaleDateString() : 'N/A'}</span>
                            <span className={`px-2 py-0.5 text-xs rounded capitalize ${getReplacementStatusColor(replacement.status)}`}>
                              {replacement.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-6">
                  {selectedClaim.status === 'pending' || selectedClaim.status === 'under_review' ? (
                    <div className="flex bg-dark-800/60 p-4 rounded-xl border border-dark-700/50 gap-3">
                      <button
                        onClick={() => handeAction(selectedClaim._id, 'approve')}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2"
                      >
                        Approve Claim
                      </button>
                      <button
                        onClick={() => handeAction(selectedClaim._id, 'reject')}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg"
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-dark-800/40 rounded-xl border border-dark-700/30">
                        <span className="text-dark-300">Current Status:</span>
                        <span className={`px-2 py-1 text-xs rounded-full capitalize ${getStatusColor(selectedClaim.status)}`}>
                          {selectedClaim.status.replace('_', ' ')}
                        </span>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-dark-300 mb-1">Update Status</label>
                        <select
                          value={updateForm.status}
                          onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })}
                          className="input-field"
                        >
                          {statusOptions.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-dark-300 mb-1">Resolution</label>
                        <select
                          value={updateForm.resolution}
                          onChange={(e) => setUpdateForm({ ...updateForm, resolution: e.target.value })}
                          className="input-field"
                        >
                          <option value="">Select resolution</option>
                          {resolutionOptions.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>

                      {updateForm.resolution === 'replacement' && (
                        <div className="bg-primary-900/10 border border-primary-500/20 p-4 rounded-xl space-y-3">
                          <h4 className="font-semibold text-primary-400 text-sm flex items-center gap-2">
                            <FiTruck /> Replacement Logistics
                          </h4>
                          <div>
                            <label className="block text-xs font-medium text-dark-400 mb-1">Tracking Number</label>
                            <input
                              type="text"
                              value={updateForm.replacementTrackingNumber}
                              onChange={(e) => setUpdateForm({ ...updateForm, replacementTrackingNumber: e.target.value })}
                              className="input-field py-1.5 text-sm"
                              placeholder="e.g., TRK12345678"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-dark-400 mb-1">Shipping Notes</label>
                            <input
                              type="text"
                              value={updateForm.replacementNotes}
                              onChange={(e) => setUpdateForm({ ...updateForm, replacementNotes: e.target.value })}
                              className="input-field py-1.5 text-sm"
                              placeholder="e.g., Shipped via FastTrack"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-1">Admin Notes (Visible to Customer)</label>
                    <textarea
                      value={updateForm.adminNotes}
                      onChange={(e) => setUpdateForm({ ...updateForm, adminNotes: e.target.value })}
                      className="input-field"
                      rows={3}
                      placeholder="Explain the decision or provide instructions..."
                    />
                  </div>
                </div>

                <div className="flex space-x-3 mt-6">
                  <button onClick={() => setSelectedClaim(null)} className="btn-secondary flex-1">Cancel</button>
                  <button onClick={handleUpdate} className="btn-primary flex-1">Update</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminWarranty;
