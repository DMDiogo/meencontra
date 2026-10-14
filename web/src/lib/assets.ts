const file = (name: string) => `/assets/image/${encodeURIComponent(name)}`;

/** Imagens originais de find/frontend/assets/image */
export const ASSETS = {
  logo: file("IMG_1704 (1).PNG"),
  logoSemCor: file("sem_cor.PNG"),
  logoMarca: file("lgo me encontra-02 (1).png"),
  logoApp: file("lgo_me_encontra-04__1_-removebg-preview.png"),
  hero: file("Asset 3.png"),
  mar: file("images (1).jpeg"),
  hotelMini: file("images.jpeg"),
  restaurante: file("restaraunte.jpg"),
  barbearia: file("barbearia.jpg"),
  moveis: file("mov.jpg"),
  hotel: file("epic-sana-luanda-hotel-exterior-pool-15.jpg"),
  mob: file("mob.webp"),
  mob2: file("mob2.jpeg"),
  mobilia: file("mobilia.webp"),
};
