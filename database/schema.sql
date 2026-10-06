
-- JAKA.LMS Database Schema
CREATE TABLE users (
  id CHAR(36) PRIMARY KEY,
  nama VARCHAR(255) NOT NULL,
  nim VARCHAR(20) UNIQUE,
  role ENUM('dosen','mahasiswa') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tugas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  judul VARCHAR(255) NOT NULL,
  deskripsi_kriteria TEXT,
  kriteria_uji JSON,
  deadline DATETIME,
  created_by CHAR(36),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE submissions (
  id CHAR(36) PRIMARY KEY,
  tugas_id INT,
  user_id CHAR(36),
  file_path VARCHAR(512),
  file_url VARCHAR(512),
  status_uji ENUM('diantrekan','diproses','berhasil','gagal') DEFAULT 'diantrekan',
  skor_akhir DECIMAL(4,1) DEFAULT 0.0,
  log_analisis TEXT,
  dikirim_pada TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tugas_id) REFERENCES tugas(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
