export class CharactersBlock {
  readonly searchButton = document.getElementById('rm-button-search') as HTMLDivElement;
  readonly searchForm = document.getElementById('form-character-search-form') as HTMLDivElement;
  constructor() {
    this.searchButton.addEventListener('click', () => {
      this.searchForm.classList.toggle('active');
    });
  }
}
