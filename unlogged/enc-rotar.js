window.addEventListener('load', function(){
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
        },4000)
    }
})