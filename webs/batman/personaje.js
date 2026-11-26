/* =========================================================
   PERSONAJE: Bruce Wayne / Batman (Christian Bale, trilogía de Nolan)
   Para otro personaje: copia este archivo, cambia textos, imágenes,
   tema (colores) y símbolo. El motor (index.html) no se toca.
   ========================================================= */
const PERSONAJE={
  fuentes:'https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@400;700;800;900&family=Cormorant+Garamond:ital,wght@1,400;1,500&family=Mrs+Saint+Delafield&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap',
  tema:{ // variables CSS del motor
    '--blanco':'#ECEAE4','--claro':'#D9D7D0','--rojo':'#F2C230','--rojo2':'#D8A812','--rosa':'#9AA3AE',
    '--noche':'#0B0F14','--negro':'#070708','--sobre':'#0B0B0B',
    '--serif':"'Big Shoulders Display',Impact,sans-serif",'--fina':"'Cormorant Garamond',Georgia,serif",'--script':"'Mrs Saint Delafield',cursive",
    '--escena':'radial-gradient(60% 70% at 50% 42%,#FFE58A 0%,#F2C230 38%,#7A5A08 78%,#1A1405 100%)',
    '--brillo':'rgba(242,194,48,.45)','--acento-texto':'#7A5A00','--grande-top':'-6vw',
    '--pie':'linear-gradient(180deg,var(--blanco) 0%,#CFCAB9 22%,#6E6440 62%,var(--rojo) 100%)'
  },
  js:{ // colores que usa el JavaScript
    acento:'#F2C230', texto:'#0B0F14', juntos:'#9AA3AE',
    pintura:['#26272B','#060607'], sombraPintura:'rgba(0,0,0,.4)',
    loader:['#3A3A3E','#F2C230','#1C1D21','#D8A812','#5A5B60','#ECEAE4'], loaderIcono:['#1A1405','#FFF1C2'],
    estampado:'simbolo' // 'telarana' o 'simbolo'
  },
  // símbolo (viewBox 0 0 100 100): murciélago estilo Caballero de la Noche
  simbolo:'<path stroke="none" d="M50 33 L47.4 25 L45.6 32.6 C38 32 27 29.5 13 22 C21 30 23 37 19.5 45 C29 41.5 37 43 41.5 50.5 C43.5 46 46.5 45.5 50 56 C53.5 45.5 56.5 46 58.5 50.5 C63 43 71 41.5 80.5 45 C77 37 79 30 87 22 C73 29.5 62 32 54.4 32.6 L52.6 25 Z"/>',
  t:{
    titulo:'Bruce Wayne — el Caballero de la Noche',
    nombre1:'BRUCE', nombre2:'WAYNE', cta:'Ponte la capucha', cta2:'Quítate la capucha', script:'Bruce',
    alt_cara:'Retrato de Bruce Wayne', alt_mascara:'Capucha de Batman', lienzo:'Pasa el cursor por la pantalla para pintar; sobre la cara aparece la capucha',
    pista:'Pásale el cursor', hero_pie:'El Caballero de la Noche · Gotham City', hero_tit1:'Wayne Enterprises', hero_tit2:'Gotham · desde 2005',
    linea1:'De día, Bruce Wayne ·', linea2:'En la Mansión Wayne ·', linea3:'De noche, el otro ·',
    az_mono:'Bruce Wayne · vigila desde arriba', az1:'Conoce cada', az2:'tejado', az3:'de Gotham', az_btn:'Ver el archivo ↓',
    gal_mono:'Archivo de la baticueva · 2005—2012', gal_txt:'Lo que la policía de Gotham nunca vio.',
    con1:'Con', con2:'Capucha', sin1:'Sin', sin2:'Capucha', ver_mascaras:'Ver capuchas',
    con_txt:'Salta de las gárgolas, interroga a los matones del puerto y nunca contesta el teléfono.',
    sin_txt:'Llega tarde a sus propias fiestas, compra hoteles por capricho y duerme hasta el mediodía.',
    ci_mono:'41.8781° N · Gotham · 00:12', ci_txt:'La ciudad se ve mejor desde una gárgola.',
    tem1:'Capuchas', tem2:'de temporada', tem_txt:'Ocho versiones, una sola cara. Kevlar de Ciencias Aplicadas, orejas rígidas y visión nocturna integrada.',
    unidad:'Capucha', anadir:'Añadir +', anadido:'Guardada en la baticueva ✓', sin_resultado:'Nada en el archivo con', encontrado:'En el archivo:',
    cosidas:'Forjadas en la baticueva, a prueba de balas y de preguntas.', cos_btn:'Ver la colección →',
    col_mono:'Colección 01 · Invierno en Gotham', col1:'Colección', col2:'de la', col3:'baticueva',
    col_txt:'Lo que Bruce lleva debajo del traje: sudadera negra, guantes con cuchillas y un batarang en cada bolsillo.', col_btn:'Ver a los de Gotham ↓',
    sudadera:'GOTHAM', polaroid:'Mansión Wayne, 3am', firma:'BW',
    barrio:'Los de<br>Gotham', juntos:'Juntos', barrio_txt:'Nadie salva Gotham solo. Un mayordomo que cose heridas, un ingeniero que no hace preguntas y un policía honesto.',
    ab1:'Su ciudad', ab2:'entera, tejado a tejado', busca:'Busca un rincón de Gotham…',
    busca_links:'<a href="#galeria">Tejados</a><a href="#galeria">Narrows</a><a href="#galeria">Puentes</a><a href="#galeria">Muelles</a>',
    menu_con:'Con capucha', menu_sin:'Sin capucha',
    pie1:'Mira', pie2:'al <span class="rj">cielo.</span>', m1:'Wayne Enterprises', m2:'Mansión Wayne', m3:'CIENCIAS APLICADAS',
    legal:'© 2026 Bruce Wayne · Gotham City', nota:'Proyecto de práctica · no oficial'
  },
  img:{ cara:'img/bale-cara.webp', mascara:'img/bale-capucha.webp', mascara3d:'img/capucha-3d.webp', mascaraEscena:'img/capucha-3d.webp', mascaraLado:'img/capucha-lado.webp', perfil:'img/bale-perfil.webp',
        ciudad:'img/gotham-aerea.webp', camara:'img/batarang.webp', sudadera:'img/capucha-negra.webp', polaroid:'img/mansion-estrellas.webp', chapa:'img/poster-tdk.webp', carta:'img/capucha-carta.webp' },
  galeria:[ // [imagen, left vw, top % de la sección, ancho vw, alto vw, velocidad, duotono, etiqueta, foco]
    ['img/esc-azotea-gordon.webp',5,8,26,16.7,.25,0,'Azotea · con Gordon','50% 50%'],
    ['img/esc-narrows.webp',39,3,15,10,.6,1,'','50% 50%'],
    ['img/esc-calle.webp',68,7,24,13.3,.4,0,'Lower Fifth · 00:40','50% 50%'],
    ['img/esc-lucius.webp',57,27,17,11.3,.15,1,'Ciencias Aplicadas','50% 40%'],
    ['img/esc-torre-wayne.webp',30,52,28,15.8,.35,0,'Torre Wayne','40% 50%'],
    ['img/esc-murcielagos.webp',3,44,17,9.6,.7,1,'','50% 40%'],
    ['img/esc-alfred.webp',77,44,18,10.1,.5,0,'Mansión · con Alfred','50% 40%'],
    ['img/batisenal.webp',61,61,14,10.5,.8,0,'Batiseñal','50% 40%'],
    ['img/esc-azotea-dent.webp',9,67,22,14.7,.3,0,'Con Dent y Gordon · 1:12am','50% 50%'],
    ['img/esc-cascada.webp',40,72,15,9.6,.55,1,'','50% 50%'],
    ['img/esc-tren.webp',78,76,17,9.6,.2,0,'Monorriel · Narrows','50% 50%'],
    ['img/gargola-bn.webp',24,23,10,12.5,.9,0,'','50% 40%'],
    ['img/esc-escalera.webp',85,27,12,6.3,.45,1,'','50% 50%'],
    ['img/esc-interrogatorio.webp',24,88,14,9.3,.65,1,'Interrogatorio','40% 40%']
  ],
  mascaras:[ // nombre, precio, filtro CSS, imagen (opcional)
    ['Begins','$ 90','none','img/capucha-lado.webp'],['Caballero','$ 120','none'],
    ['Sigilo','$ 110','brightness(.7) contrast(1.4) drop-shadow(0 0 16px rgba(242,194,48,.35))'],['Ártico','$ 95','invert(1) brightness(1.15) contrast(.9)'],
    ['Acero','$ 100','sepia(1) hue-rotate(170deg) saturate(2.2) brightness(1.5)'],['Oro Wayne','$ 300','sepia(1) saturate(3.4) brightness(1.7) contrast(1.1)'],
    ['Arkham','$ 85','sepia(1) hue-rotate(55deg) saturate(2.4) brightness(1.4)'],['Ceniza','$ 70','brightness(2) contrast(.8) grayscale(1)']
  ],
  aliados:['Alfred Pennyworth','Lucius Fox','COMISARIO GORDON','Rachel Dawes','Wayne Enterprises','Ciencias Aplicadas'],
  rueda:['img/esc-cornisa.webp','img/torre-willis.webp','img/esc-gordon.webp','img/lluvia-neon.webp','img/esc-bruce-ventana.webp','img/poster-tdk.webp','img/esc-liga.webp','img/puente-noche.webp','img/esc-rises.webp','img/tren-luz.webp','img/skyline-azul.webp']
};
