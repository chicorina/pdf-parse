const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');

// サーバー設定
const app = express();
const port = process.env.PORT || 3000;

// Multerの設定（アップロードされたファイルを一時的に保存）
const upload = multer({ dest: 'uploads/' });

// 正規表現パターン
const pattern = /^\s*(.*?)\s+([0-9]+(\.[0-9]+)?)\s+(A\+|A|B|C|C\-|F|W|P|NP)\s*(\d{4})\s*(春|秋)\s*(.*)\s*$/;

// データ解析関数
const parseLine = (line) => {
  const match = line.match(pattern);
  if (match) {
    return {
      lectureName: match[1].trim(),
      credits: parseFloat(match[2]),
      grade: match[4],
      year: parseInt(match[5]),
      semester: match[6],
      professor: match[7].trim(),
    };
  }
  return null;
};

// PDF解析エンドポイント
app.post('/parse-pdf', upload.single('pdf'), async (req, res) => {
  try {
    // ファイルがアップロードされていない場合
    if (!req.file) {
      return res.status(400).send({ error: 'PDFファイルが必要です' });
    }

    // アップロードされたPDFファイルのパス
    const filePath = path.resolve(req.file.path);

    // ファイルを読み込み
    const dataBuffer = fs.readFileSync(filePath);

    // PDF解析
    const data = await pdfParse(dataBuffer);
    const lines = data.text.split('\n');

    // データを解析
    const lectures = lines.map(parseLine).filter((lecture) => lecture !== null);

    // 一時ファイルを削除
    fs.unlinkSync(filePath);

    // 結果を返す
    res.status(200).json({ success: true, data: lectures });
  } catch (error) {
    console.error('PDF解析エラー:', error);
    res.status(500).send({ error: 'PDF解析中にエラーが発生しました' });
  }
});

// サーバー起動
app.listen(port, () => {
  console.log(`サーバーがポート ${port} で起動中`);
});
