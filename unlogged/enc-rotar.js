window.addEventListener('load', function(){
    var diameanteFondo = document.getElementById('id-img-encB');
    if(diameanteFondo && document.body.getAttribute('que-pantalla')=='indicador'){
        // diameanteFondo.style.cursor='link';
        // diameanteFondo.
    }
    var rotables = document.getElementsByClassName('enc-rotables');
    if(rotables.length){
        var position=0;
        var anterior = rotables[position];
        anterior.style.opacity=1;
        setInterval(function(){
            if(anterior != null){
                anterior.style.opacity=0;
            }
            position++;
            if(position>=rotables.length) position=0;
            var actual = rotables[position];
            actual.style.opacity=1;
            anterior = actual;
        },8000)
    }
})