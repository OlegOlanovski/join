const mobileAddBtn = document.getElementById('mobileAddContactBtn');
if (mobileAddBtn) {
  mobileAddBtn.addEventListener('click', () => {
    document.getElementById('openAddContact')?.click();
  });
}

const mobileMoreBtn = document.getElementById('mobileMoreBtn');
if (mobileMoreBtn) {
  mobileMoreBtn.addEventListener('click', () => {
    document.getElementById('contactsMoreMenu')?.classList.toggle('d-none');
  });
}