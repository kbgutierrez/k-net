<style>
  .coord-page {
    padding: 14px;
    background: #f8f9fc;
    min-height: 100vh;
  }
  .coord-title {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 4px;
  }
  .coord-sub {
    font-size: 12px;
    color: #6b7280;
    margin-bottom: 14px;
  }
  .coord-card {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 14px;
    margin-bottom: 14px;
    box-shadow: 0 1px 2px rgba(0,0,0,.04);
  }
  .coord-grid {
    display: grid;
    grid-template-columns: 140px 80px 80px 1fr;
    gap: 8px;
    align-items: center;
    margin-bottom: 8px;
  }
  .coord-grid.header {
    font-weight: 700;
    font-size: 12px;
    color: #374151;
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 6px;
    margin-bottom: 10px;
  }
  .coord-grid input {
    font-size: 12px;
    padding: 4px 8px;
    border: 1px solid #d1d5db;
    border-radius: 4px;
  }
  .coord-grid label {
    font-size: 12px;
    font-weight: 600;
    color: #1f2937;
  }
  .preview-frame {
    width: 100%;
    height: 800px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: #fff;
  }
  .btn-test {
    background: #6366f1;
    color: #fff;
    border: none;
    padding: 8px 20px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
  }
  .btn-test:hover {
    background: #4f46e5;
  }
  .btn-download {
    background: #10b981;
    color: #fff;
    border: none;
    padding: 8px 20px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    margin-left: 8px;
    text-decoration: none;
    display: inline-block;
  }
  .legend {
    font-size: 11px;
    color: #6b7280;
    margin-top: 8px;
    padding: 8px;
    background: #f3f4f6;
    border-radius: 4px;
  }
  .legend span {
    display: inline-block;
    width: 12px;
    height: 12px;
    background: #ffcdd2;
    border: 1px solid red;
    margin-right: 4px;
    vertical-align: middle;
  }
</style>

<div class="page-inner coord-page">
  <div class="coord-title">PDF Coordinate Calibration</div>
  <div class="coord-sub">
    Adjust X (mm from left) and Y (mm from top) values. 
    The generated PDF shows a red box where text lands and a millimeter grid. 
    Print this page or open the PDF to align with your blank paper template.
  </div>

  <div class="row">
    <!-- Left: Form -->
    <div class="col-lg-5">
      <div class="coord-card">
        <form method="POST" action="<?= base_url('transactions/cash-advance/test-pdf-coords'); ?>">
          <div class="coord-grid header">
            <div>Field</div>
            <div>X (mm)</div>
            <div>Y (mm)</div>
            <div>Sample Text</div>
          </div>

          <?php foreach ($fields as $key => $f): ?>
          <div class="coord-grid">
            <label><?= str_replace('_', ' ', $key); ?></label>
            <input type="number" step="0.5" name="<?= $key; ?>_x" value="<?= $f['x']; ?>" required>
            <input type="number" step="0.5" name="<?= $key; ?>_y" value="<?= $f['y']; ?>" required>
            <input type="text" name="<?= $key; ?>_text" value="<?= html_escape($f['text']); ?>">
          </div>
          <?php endforeach; ?>

          <div style="margin-top: 14px; display:flex; align-items:center;">
            <button type="submit" class="btn-test">
              <i class="fas fa-sync-alt mr-1"></i> Generate Test PDF
            </button>
            <a href="<?= $pdf_url; ?>" target="_blank" class="btn-download">
              <i class="fas fa-external-link-alt mr-1"></i> Open PDF in New Tab
            </a>
          </div>

          <div class="legend">
            <span></span> Red box = exact coordinate landing spot. Grid lines = every 10mm.
            <br>Tip: Hold your printed test PDF over the blank paper template to see misalignment.
          </div>
        </form>
      </div>
    </div>

    <!-- Right: Preview -->
    <div class="col-lg-7">
      <div class="coord-card" style="padding:8px;">
        <iframe class="preview-frame" src="<?= $pdf_url; ?>"></iframe>
      </div>
    </div>
  </div>
</div>