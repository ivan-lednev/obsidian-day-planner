<div class="needle" style:transform="translateY(calc(60px * 2.70))">
  <div class="bullet"></div>
</div>

<style>
  .needle {
    position: absolute;
    left: 0;
    right: 0;
    height: 2px;
    background-color: var(--color-accent);
  }

  .bullet {
    position: absolute;
    left: -4px;
    top: -4px;
    border-radius: 50%;
    border: 5px solid var(--color-accent);
  }
</style>
