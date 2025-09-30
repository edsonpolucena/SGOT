const { createObligation, listObligations, getObligation, updateObligation, deleteObligation } = require('./obligation.service');
const { createObligationFile, getObligationFiles, getFileViewUrl, getFileDownloadUrl, deleteObligationFile } = require('./obligation-file.service');

async function postObligation(req, res) {
  try {
    const { title, regime, periodStart, periodEnd, dueDate, amount, notes, companyId } = req.body;
    
    if (!title || !regime || !periodStart || !periodEnd || !dueDate || !companyId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const created = await createObligation(req.userId, {
      title,
      regime,
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
      dueDate: new Date(dueDate),
      amount: amount ? parseFloat(amount) : null,
      notes,
      companyId: parseInt(companyId)
    });
    
    return res.status(201).json(created);
  } catch (error) {
    console.error('Error creating obligation:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function getObligations(req, res) {
  try {
    const { status, regime, from, to, companyId } = req.query;
    const items = await listObligations(req.userId, req.user.role, {
      status,
      regime,
      companyId: companyId ? parseInt(companyId) : undefined,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
    return res.json(items);
  } catch (error) {
    console.error('Error listing obligations:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function getObligationById(req, res) {
  try {
    const item = await getObligation(req.userId, req.user.role, req.params.id);
    if (!item) return res.status(404).json({ message: 'Obligation not found' });
    return res.json(item);
  } catch (error) {
    console.error('Error getting obligation:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function putObligation(req, res) {
  try {
    const updated = await updateObligation(req.userId, req.user.role, req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: 'Obligation not found' });
    return res.json(updated);
  } catch (error) {
    console.error('Error updating obligation:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function deleteObligationById(req, res) {
  try {
    const ok = await deleteObligation(req.userId, req.user.role, req.params.id);
    if (!ok) return res.status(404).json({ message: 'Obligation not found' });
    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting obligation:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Novos endpoints para gerenciamento de arquivos
async function uploadFiles(req, res) {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const obligationId = req.params.id;
    const uploadedFiles = [];

    for (const file of req.files) {
      const fileRecord = await createObligationFile(obligationId, file, req.userId);
      uploadedFiles.push(fileRecord);
    }

    return res.status(201).json({ 
      message: 'Files uploaded successfully',
      files: uploadedFiles 
    });
  } catch (error) {
    console.error('Error uploading files:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function getFiles(req, res) {
  try {
    const files = await getObligationFiles(req.params.id, req.userId);
    return res.json(files);
  } catch (error) {
    console.error('Error getting files:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function viewFile(req, res) {
  try {
    const signedUrl = await getFileViewUrl(req.params.fileId, req.userId);
    return res.json({ viewUrl: signedUrl });
  } catch (error) {
    console.error('Error generating view URL:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function downloadFile(req, res) {
  try {
    const signedUrl = await getFileDownloadUrl(req.params.fileId, req.userId);
    return res.json({ downloadUrl: signedUrl });
  } catch (error) {
    console.error('Error generating download URL:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function deleteFile(req, res) {
  try {
    const success = await deleteObligationFile(req.params.fileId, req.userId);
    if (!success) return res.status(404).json({ message: 'File not found' });
    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting file:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = { 
  postObligation, 
  getObligations, 
  getObligationById, 
  putObligation, 
  deleteObligationById,
  uploadFiles,
  getFiles,
  viewFile,
  downloadFile,
  deleteFile
};
