async page => {
  const outcomes = [];
  // Buka aplikasi dan login menggunakan akun admin yang sudah ada terlebih dahulu.
  if (await page.getByRole('button', { name: 'Audit log', exact: true }).count() === 0) {
    throw new Error('Buka katalog dan login dengan akun admin yang sudah ada, lalu jalankan skrip ini.');
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole('button', { name: 'Audit log', exact: true }).click();
  await page.getByRole('heading', { name: 'Audit log', exact: true }).waitFor();
  await page.getByRole('button', { name: /Lihat detail audit nomor/ }).first().waitFor();
  await page.screenshot({ path: 'output/t5-evidence/01-audit-page.png', fullPage: true });
  outcomes.push('Daftar audit admin tampil');

  if (await page.getByRole('button', { name: 'Berikutnya', exact: true }).isEnabled()) {
  const response2 = page.waitForResponse(r => r.url().includes('/audit-logs?') && r.url().includes('page=2'));
  await page.getByRole('button', { name: 'Berikutnya', exact: true }).click();
  await response2;
  await page.waitForFunction(() => document.querySelector('nav[aria-label="Navigasi halaman audit log"]').innerText.includes('Halaman 2'));
  await page.screenshot({ path: 'output/t5-evidence/02-pagination.png', fullPage: true });
  outcomes.push('Pagination berpindah ke halaman 2');

  const response1 = page.waitForResponse(r => r.url().includes('/audit-logs?') && r.url().includes('page=1'));
  await page.getByRole('button', { name: 'Sebelumnya', exact: true }).click();
  await response1;
  await page.locator('.audit-results[aria-busy="false"]').waitFor();
  } else {
    outcomes.push('Jumlah data yang ada belum memerlukan halaman kedua; tidak menambah catatan buatan');
  }
  const detailPromise = page.waitForResponse(r => /\/audit-logs\/\d+/.test(r.url()));
  await page.getByRole('button', { name: /Lihat detail audit nomor/ }).first().click();
  const detailResponse = await detailPromise;
  const detail = (await detailResponse.json()).data;
  await page.locator('dialog .audit-detail-list').waitFor();
  if (!detail.metadata.ip_address || !detail.metadata.user_agent) throw new Error('Metadata request tidak lengkap');
  await page.locator('dialog').screenshot({ path: 'output/t5-evidence/03-detail.png' });
  outcomes.push('Modal memanggil GET /:id dan memperlihatkan IP/user-agent dari server');
  await page.locator('dialog').getByRole('button', { name: 'Tutup', exact: true }).click();

  await page.locator('input[name="targetId"]').fill(String(detail.targetId));
  await page.locator('input[name="userId"]').fill(String(detail.userId));
  await page.locator('input[name="action"]').fill(detail.action);
  const filterPromise = page.waitForResponse(r => r.url().includes('/audit-logs?') &&
    r.url().includes('targetId=') && r.url().includes('userId='));
  await page.getByRole('button', { name: 'Terapkan filter' }).click();
  const filtered = (await (await filterPromise).json()).data;
  if (!filtered.items.length || !filtered.items.every(x => x.userId === detail.userId && x.targetId === detail.targetId)) {
    throw new Error('Hasil filter tidak sesuai');
  }
  await page.locator('.audit-results[aria-busy="false"]').waitFor();
  await page.screenshot({ path: 'output/t5-evidence/04-filter.png', fullPage: true });
  outcomes.push('Filter targetId/userId menghasilkan baris yang sesuai');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: /Lihat detail audit nomor/ }).first().click();
  await page.locator('dialog .audit-detail-list').waitFor();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  if (overflow) throw new Error('Halaman meluap pada viewport mobile');
  await page.screenshot({ path: 'output/t5-evidence/05-mobile-detail.png', fullPage: true });
  outcomes.push('Modal detail tampil pada viewport mobile tanpa overflow halaman');
  await page.locator('dialog').getByRole('button', { name: 'Tutup', exact: true }).click();
  await page.setViewportSize({ width: 1440, height: 1000 });

  await page.locator('input[name="userId"]').fill('2147483647');
  const emptyPromise = page.waitForResponse(r => r.url().includes('userId=2147483647'));
  await page.getByRole('button', { name: 'Terapkan filter' }).click();
  await emptyPromise;
  await page.getByRole('heading', { name: 'Tidak ada catatan audit' }).waitFor();
  await page.screenshot({ path: 'output/t5-evidence/06-empty-state.png', fullPage: true });
  outcomes.push('Hasil kosong ditampilkan dengan benar');
  await page.getByRole('button', { name: 'Hapus filter' }).click();
  await page.getByRole('button', { name: /Lihat detail audit nomor/ }).first().waitFor();
  return {
    database: 'review_kantin', outcomes,
    detailResponse: { status: detailResponse.status(), data: detail },
    filterResponse: filtered,
  };
}
