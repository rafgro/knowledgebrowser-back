module.exports = function(grunt) {
    grunt.initConfig({
        concat: {
            dist: {
                src: ['server.js', 'downloadBiorxivRss.js'],
                dest: 'dist/build.js',
            }
        },
        my_src_files: ['server.js', 'downloadBiorxivRss.js'],
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.registerTask('default', ['concat']);
};