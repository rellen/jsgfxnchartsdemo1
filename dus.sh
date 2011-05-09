if [ `uname -s` = "Darwin" ] ; then
  # assume Mac OS X
  du -d $1 -I /proc $2
else
  # assume Linux box
  du -a -X exclude.txt --max-depth=$1 $2 
fi