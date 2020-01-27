import { saveAs } from 'file-saver';

import core from 'core';
import { isIE } from 'helpers/device';
import fireEvent from 'helpers/fireEvent';
import actions from 'actions';

export default (dispatch, options = {}) => {
  const {
    filename = core.getDocument()?.getFilename() || 'document',
    includeAnnotations = true,
    xfdfData,
    externalURL,
  } = options;
  const downloadOptions = { downloadType: 'pdf' };
  let file;

  dispatch(actions.openElement('loadingModal'));

  return core
    .exportAnnotations()
    .then(xfdfString => {
      const doc = core.getDocument();
      if (includeAnnotations) {
        downloadOptions.xfdfString = xfdfData || xfdfString;
      }
      if (doc.getType() === 'office') {
        downloadOptions.downloadType = 'office';
      }

      const getDownloadFilename = (name, extension) => {
        if (name.slice(-extension.length).toLowerCase() !== extension) {
          name += extension;
        }
        return name;
      };

      const extension = filename.split('.');
      const downloadName = getDownloadFilename(filename, `.${extension[extension.length - 1]}`);

      if (externalURL) {
        const downloadIframe =
          document.getElementById('download-iframe') ||
          document.createElement('iframe');
        downloadIframe.width = 0;
        downloadIframe.height = 0;
        downloadIframe.id = 'download-iframe';
        downloadIframe.src = null;
        document.body.appendChild(downloadIframe);
        downloadIframe.src = externalURL;
        dispatch(actions.closeElement('loadingModal'));
        fireEvent('finishedSavingPDF');
      } else {
        return doc.getFileData(downloadOptions).then(
          data => {
            const arr = new Uint8Array(data);
            if (isIE) {
              file = new Blob([arr], { type: 'application/pdf' });
            } else {
              file = new File([arr], downloadName, { type: 'application/pdf' });
            }

            saveAs(file, downloadName);
            dispatch(actions.closeElement('loadingModal'));
            fireEvent('finishedSavingPDF');
          },
          error => {
            dispatch(actions.closeElement('loadingModal'));
            throw new Error(error.message);
          }
        );
      }
    })
    .catch(() => {
      dispatch(actions.closeElement('loadingModal'));
    });
};
