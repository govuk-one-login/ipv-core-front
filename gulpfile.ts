// const gulp = require("gulp");
// const rev = require("gulp-rev");
import gulp from 'gulp';
import rev from 'gulp-rev';
import revReplace from 'gulp-rev-replace';

gulp.task('renameAssets', function() {
	return gulp.src('dist/**')
		.pipe(rev())
		.pipe(gulp.dest('dist/'))
		.pipe(rev.manifest())
		.pipe(gulp.dest('dist/'))
});

gulp.task('updateAssetReferencesInViews', function() {
  return updateAssetReferences('views');
});

gulp.task('updateAssetReferencesInBase', function() {
 return updateAssetReferences('node_modules/@govuk-one-login/frontend-ui/build/components');
});

gulp.task('versionAssets', gulp.series(
	'renameAssets',
	'updateAssetReferencesInViews',
	'updateAssetReferencesInBase'
));

function updateAssetReferences(path: string) {
  const manifest = gulp.src('dist/rev-manifest.json');
  const extensions = ['.html', '.njk'];

  return gulp.src(`${path}/**`)
    .pipe(revReplace({manifest: manifest, replaceInExtensions: extensions}))
    .pipe(gulp.dest(path));
}
